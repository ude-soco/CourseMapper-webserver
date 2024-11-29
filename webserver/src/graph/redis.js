import { createClient, WatchError } from 'redis';
const crypto = require('crypto');
const socketio = require("../socketio");

const redis = {}
const listeners = {};

const pipelines = ['concept-map', 'modify-graph', 'expand-material', 'concept-recommendation', 'resource-recommendation',
  'recs_get_concepts', 'recs_get_resources', 'get_resources_by_main_concepts'
];
const jobTimeout = 30;

export async function connect(host, port, database, password) {
  const url = `redis://:${password}@${host}:${port}/${database}`
  redis.client = createClient({ url });
  redis.client.on('connect', () => {
    console.log('Connected to Redis');
    setInterval(runHousekeeping, 5000);
  });
  redis.client.on('error', (error) => {
    console.error('Failed to connect to Redis', error);
  });
  redis.client.connect();

  watchDoneQueue(url);
  watchLogQueue(url);
}

export function onJobDone(jobId, listener) {
  if (!listeners[jobId]) {
    listeners[jobId] = [];
  }
  listeners[jobId].push(listener);
}

async function watchDoneQueue(url) {
  const queueClient = createClient({ url });
  queueClient.on('error', (error) => {
    console.error('Failed to connect to Redis in watch done queue', error);
  });
  queueClient.connect();

  while (true) {
    const result = await queueClient.brPop('queue:done', 0);
    const element = JSON.parse(result.element);
    const jobId = element.job_id;
    const jobListeners = listeners[jobId];
    if (jobListeners) {
      jobListeners.forEach((listener) => listener(element));
    }
    delete listeners[jobId];
  }
}

async function watchLogQueue(url) {
  const queueClient = createClient({ url });
  queueClient.on('error', (error) => {
    console.error('Failed to connect to Redis in watch log queue', error);
  });
  queueClient.connect();

  while (true) {
    const result = await queueClient.brPop('log', 0);
    const element = JSON.parse(result.element);
    socketio.getIO().to("material:all").emit('log', element);
    if (!element.job_id) {
      continue;
    }
    const job = await queueClient.hGet('jobs', element.job_id);
    if (!job) {
      continue;
    }
    const jobData = JSON.parse(job);
    if (!jobData.materialId) {
      continue;
    }
    socketio.getIO().to("material:"+jobData.materialId).emit('log', element);
    socketio.getIO().to("material:all").emit('log', element);
  }
}

async function runHousekeeping() {
  // Check for hanging jobs
  for (const pipeline of pipelines) {
    const jobs = await redis.client.lRange(`queue:${pipeline}:processing`, 0, -1);
    for (const jobId of jobs) {
      const status = await redis.client.hGet('last_updates', jobId);
      if (!status) {
        continue;
      }
      const lastUpdated = parseInt(status);
      const now = Date.now() / 1000;
      if (now - lastUpdated > jobTimeout) {
        console.error(`Job ${jobId} in pipeline ${pipeline} has timed out. Requeuing`);
        await redis.client.lRem(`queue:${pipeline}:processing`, 0, jobId);
        await redis.client.lPush(`queue:${pipeline}:pending`, jobId);
      }
    }
  }
}

export async function addJob(pipeline, job, beforeStart, onDone) {
  job.pipeline = pipeline;

  const jobData = JSON.stringify(job);
  const jobId = getHash(jobData);

  if (onDone) {
    onJobDone(jobId, onDone);
  }

  const jobAdded = await redis.client.hSetNX('jobs', jobId, jobData);

  if (jobAdded) {
    if (beforeStart) {
      beforeStart(jobId);
    }
    await redis.client.lPush(`queue:${pipeline}:pending`, jobId);
    console.log(`Added job ${jobId} to pipeline ${pipeline}`);
  } else {
    console.log(`Job exists with id ${jobId} in pipeline ${pipeline}`);
  }

  return { exists: !jobAdded, jobId };
}

export async function trackJob(pipeline, job, onDone) {
  job.pipeline = pipeline;

  const jobId = getHash(JSON.stringify(job));
  const jobExists = await redis.client.hExists('jobs', jobId);
  if (jobExists) {
    console.log(`Job exists with id ${jobId} in pipeline ${pipeline}`);
    onJobDone(jobId, onDone);
    return jobId;
  }

  onDone(null);
}

export function addFile(materialId, file) {
  return redis.client.hSet('files', materialId, file);
}

function getHash(text) {
  const hash = crypto.createHash('sha256');
  hash.update(text);
  return hash.digest('hex');
}
