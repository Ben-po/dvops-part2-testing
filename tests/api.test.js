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

  // Test 1: Register new user successfully
  // Verifies that a new user can be registered successfully, returning HTTP 200, a success flag, user details, and an authentication token.
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

  // Test 2: Fail registration with missing username
  // Ensures the API rejects requests without a username and returns HTTP 400 with an appropriate error message.
  it('POST /api/register should fail with missing username', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ password: 'TestPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  // Test 3: Fail registration with missing password
  // Confirms that requests missing a password are rejected with HTTP 400.
  it('POST /api/register should fail with missing password', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'testuser@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  // Test 4: Fail registration with empty username
  // Validates input sanitisation by rejecting empty string usernames.
  it('POST /api/register should fail with empty string username', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: '', password: 'TestPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  // Test 5: Fail registration with empty password
  // Ensures empty passwords are rejected to prevent invalid user creation.
  it('POST /api/register should fail with empty string password', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'testuser@example.com', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  // Test 6: Handle null request body during registration
  // Confirms that malformed or null request bodies are handled safely without crashing the server.
  it('POST /api/register should handle null request body', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(null);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  // Test 7: Fail registration with duplicate username
  // Verifies that duplicate user registrations are prevented and return HTTP 409.
  it('POST /api/register should fail with duplicate username', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(existingUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already taken');
  });

  // Test 8: Login with correct credentials
  // Verifies successful authentication using valid credentials, returning HTTP 200, user details, and an authentication token.
  it('POST /api/login should authenticate user with correct credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send(existingUser);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe(existingUser.username);
    expect(res.body.token).toBeDefined();
  });

  // Test 9: Fail login with incorrect password
  // Ensures authentication fails when an incorrect password is provided, returning HTTP 401.
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

  // Test 10: Fail login with non-existent user
  // Confirms that login attempts for users not in the system are rejected with HTTP 401.
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

  // Test 11: Fail login with missing username
  // Validates backend input checks for missing username fields.
  it('POST /api/login should fail with missing username', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ password: 'SomePassword' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  // Test 12: Fail login with missing password
  // Ensures missing password inputs are handled safely and rejected.
  it('POST /api/login should fail with missing password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: existingUser.username });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  // Test 13: Fail login with empty username
  // Validates sanitisation of empty string usernames.
  it('POST /api/login should fail with empty string username', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: '', password: 'SomePassword' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  // Test 14: Fail login with empty password
  // Ensures empty passwords are rejected to prevent invalid authentication attempts.
  it('POST /api/login should fail with empty string password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: existingUser.username, password: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  // Test 15: Handle null request body during login
  // Confirms backend stability and error handling when receiving null login requests.
  it('POST /api/login should handle null request body', async () => {
    const res = await request(app)
      .post('/api/login')
      .send(null);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });
});