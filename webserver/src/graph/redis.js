import { createClient, WatchError } from 'redis';
const crypto = require('crypto');

const redis = {}
const listeners = {};

const pipelines = ['concept-map', 'concept-recommendation', 'resource-recommendation'];
const jobTimeout = 30;

export async function connect(host, port, database, password) {
  redis.client = createClient({
    host,
    port,
    database,
    password,
  });
  redis.client.on('connect', () => {
    console.log('Connected to Redis');
    setInterval(runHousekeeping, 5000);
  });
  redis.client.on('error', (error) => {
    console.error('Failed to connect to Redis', error);
  });
  redis.client.connect();

  watchDoneQueue(host, port, database, password);
}

export function onJobDone(jobId, listener) {
  if (!listeners[jobId]) {
    listeners[jobId] = [];
  }
  listeners[jobId].push(listener);
}

async function watchDoneQueue(host, port, database, password) {
  const queueClient = createClient({
    host,
    port,
    database,
    password,
  });
  queueClient.on('error', (error) => {
    console.error('Failed to connect to Redis in watch queue', error);
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

  const jobId = getJobId(job);

  try {
    await redis.client.executeIsolated(async (isolatedClient) => {
      // Watch the jobs and pending queues to ensure no other process is adding the same job
      await isolatedClient.watch('jobs');
      await isolatedClient.watch(`queue:${pipeline}:pending`);

      // Check if the job already exists
      const jobExists = await isolatedClient.hExists('jobs', jobId);
      if (jobExists) {
        console.log(`Job exists with id ${jobId} in pipeline ${pipeline}`);
        onJobDone(jobId, onDone);
        return;
      }

      console.log(`Adding job ${jobId} to pipeline ${pipeline}`);

      if (onDone) {
        onJobDone(jobId, onDone);
      }
      if (beforeStart) {
        beforeStart(jobId);
      }
      const jobData = JSON.stringify(job);

      // Add the job to the jobs hash and the pending queue
      const multi = isolatedClient.multi();
      await multi.hSet('jobs', jobId, jobData);
      await multi.lPush(`queue:${pipeline}:pending`, jobId);

      return multi.exec();
    });
  } catch (error) {
    if (error instanceof WatchError) {
      console.error('Failed to add job due to WatchError. Retrying...');
      return addJob(pipeline, job, beforeStart, onDone);
    }
    console.error('Failed to add job', error);
  }
  return jobId;
}

export async function trackJob(pipeline, job, onDone) {
  job.pipeline = pipeline;

  const jobId = getJobId(job);
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

function getJobId(job) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(job));
  return hash.digest('hex');
}
