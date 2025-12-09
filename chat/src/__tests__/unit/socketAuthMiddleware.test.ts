import { socketAuthMiddleware } from '../../middleware/auth';
import axios from 'axios';
import { AuthenticatedSocket } from '../../types/socket';

// Mock axios
jest.mock('axios');

describe('Socket Authentication Middleware', () => {
  let mockSocket: Partial<AuthenticatedSocket>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockSocket = {
      handshake: {
        auth: { token: 'valid-token' },
        headers: {},
        time: '',
        address: '',
        xdomain: false,
        secure: false,
        issued: 0,
        url: '',
        query: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, // Bỏ qua kiểm tra kiểu cho handshake để đơn giản hóa
      emit: jest.fn(),
      on: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
      id: 'test-socket-id',
      connected: true,
      data: {},
      userId: undefined,
      userRole: undefined
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate user with valid token and call next', async () => {
    // Mock axios để trả về thông tin người dùng hợp lệ
    (axios.post as jest.Mock).mockResolvedValue({
      data: { isValid: true, userId: 'test-user-id', userRole: 'patient' },
    });

    await socketAuthMiddleware(mockSocket as AuthenticatedSocket, mockNext);

    expect(axios.post).toHaveBeenCalledWith(
      `${process.env.AUTH_SERVICE_URL}/verify-token`,
      { token: 'valid-token' }
    );
    expect(mockSocket.userId).toBe('test-user-id');
    expect(mockSocket.userRole).toBe('patient');
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject connection with invalid token', async () => {
    // Mock axios để trả về lỗi xác thực
    (axios.post as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    await socketAuthMiddleware(mockSocket as AuthenticatedSocket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication failed'
      })
    );
  });

  it('should reject connection when no token is provided', async () => {
    const mockSocketWithoutToken: Partial<AuthenticatedSocket> = {
      handshake: {
        auth: {},
        headers: {},
        time: '',
        address: '',
        xdomain: false,
        secure: false,
        issued: 0,
        url: '',
        query: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any, // Bỏ qua kiểm tra kiểu cho handshake để đơn giản hóa
      emit: jest.fn(),
      on: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      disconnect: jest.fn(),
      id: 'test-socket-id',
      connected: true,
      data: {},
      userId: undefined,
      userRole: undefined
    };

    await socketAuthMiddleware(mockSocketWithoutToken as AuthenticatedSocket, mockNext);

    expect(axios.post).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication token required'
      })
    );
  });

  it('should handle axios errors gracefully', async () => {
    // Mock axios để ném lỗi mạng
    (axios.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    await socketAuthMiddleware(mockSocket as AuthenticatedSocket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication failed'
      })
    );
  });

  it('should handle unexpected errors in middleware', async () => {
    // Mock axios để ném lỗi bất ngờ
    (axios.post as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    await socketAuthMiddleware(mockSocket as AuthenticatedSocket, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication failed'
      })
    );
  });
});