const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { app, server } = require('../server');

const USERS_FILE = path.join(__dirname, '..', 'utils', 'skilllink.json');

// Ensure a clean users file before tests run
beforeAll(() => {
  if (fs.existsSync(USERS_FILE)) {
    fs.unlinkSync(USERS_FILE);
  }
});

// Close server after all tests complete
afterAll(() => server.close());

describe('Authentication API', () => {
  const existingUser = {
    username: 'existinguser@example.com',
    password: 'CorrectPassword123'
  };

  // Seed a known user for login tests (independent from the register test)
  beforeAll(async () => {
    await request(app)
      .post('/api/register')
      .send(existingUser);
  });

  it('POST /api/register should create a new user', async () => {
    const newUser = {
      username: `testuser-${Date.now()}@example.com`,
      password: 'TestPassword123'
    };

    const res = await request(app)
      .post('/api/register')
      .send(newUser);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe(newUser.username);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/register should fail with missing username', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ password: 'TestPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('POST /api/register should fail with missing password', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'testuser@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('POST /api/register should fail with empty string username', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: '', password: 'TestPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('POST /api/register should fail with empty string password', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'testuser@example.com', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('POST /api/register should handle null request body', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(null);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('POST /api/register should fail with duplicate username', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(existingUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already taken');
  });

  it('POST /api/login should authenticate user with correct credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send(existingUser);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe(existingUser.username);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/login should fail with incorrect password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: existingUser.username,
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/login should fail with non-existent user', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'nonexistent@example.com',
        password: 'SomePassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/login should fail with missing username', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ password: 'SomePassword' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('POST /api/login should fail with missing password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: existingUser.username });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('POST /api/login should fail with empty string username', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: '', password: 'SomePassword' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('POST /api/login should fail with empty string password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: existingUser.username, password: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('POST /api/login should handle null request body', async () => {
    const res = await request(app)
      .post('/api/login')
      .send(null);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });
});