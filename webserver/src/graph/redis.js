import { createClient } from 'redis';

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

export async function addJob(pipeline, job, onDone) {
  job.pipeline = pipeline;

  const existingJobId = await findExistingJob(job);
  if (existingJobId) {
    console.log(`Job exists with id ${existingJobId} in pipeline ${pipeline}`);
    onJobDone(jobId, onDone);
    return existingJobId;
  }

  const jobId = (await redis.client.incr('jobId')).toString();
  console.log(`Adding job ${jobId} to pipeline ${pipeline}`);
  onJobDone(jobId, onDone);
  const jobData = JSON.stringify(job);
  await redis.client.hSet('jobs', jobId, jobData);
  await redis.client.lPush(`queue:${pipeline}:pending`, jobId);
  return jobId;
}

async function findExistingJob(jobData) {
  const jobs = await redis.client.hGetAll('jobs');
  for (const jobId in jobs) {
    const existingJob = JSON.parse(jobs[jobId]);
    // FIXME Issue #640: This only works if job only contains scalar values
    if (Object.keys(jobData).every((key) => jobData[key] === existingJob[key])) {
      return jobId;
    }
  }
  return null;
}

export function addFile(materialId, file) {
  return redis.client.hSet('files', materialId, file);
}
