process.env.APP_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://ns:ns@localhost:54329/nearsoul_test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-0123456789';
process.env.EMAIL_PROVIDER = 'console';
process.env.STORAGE_DRIVER = 'local';
process.env.LOCAL_STORAGE_DIR = '.data/test-storage';
