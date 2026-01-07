const request = require('supertest');
const { app, server } = require('../server');

// Close server after all tests complete
afterAll(() => server.close());

describe('Authentication API', () => {
  let token;
  const testUser = {
    username: 'testuser@example.com',
    password: 'TestPassword123'
  };

  it('POST /api/register should create a new user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(testUser);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.token).toBeDefined();

    // Store token for login test
    token = res.body.token;
  });

  it('POST /api/login should authenticate user with correct credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send(testUser);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/login should fail with incorrect password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: testUser.username,
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
});