/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { OperationCanceledError } from '#utils/shell';
import type { AuthContext } from '#auth/types';

vi.mock('#utils/prompts', () => ({
  prompts: vi.fn(),
}));

vi.mock('#utils/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock('#i18n', () => ({
  t: vi.fn((key: string, params?: Record<string, string>) => {

    if (key === 'ssh.hostUntrusted')
      return `Host ${params?.hostname} is untrusted`;

    if (key === 'ssh.keyType')
      return `Key type: ${params?.type}`;

    if (key === 'ssh.fingerprint')
      return `Fingerprint: ${params?.fingerprint}`;

    if (key === 'ssh.confirmHostIsTrusted')
      return 'Do you trust this host?';

    if (key === 'yes')
      return 'Yes';

    if (key === 'no')
      return 'No';

    return key;

  }),
}));

vi.mock('chalk', () => ({
  default: {
    red: (text: string) => text,
  },
}));

import { hasKnownHostAsync, fetchHostKeyAsync, addToKnownHostsAsync, confirmHost } from '#auth/ssh/host';
import { prompts } from '#utils/prompts';
import { logger } from '#utils/logger';

describe('hasKnownHostAsync', () => {

  it('should return true when host is found in known_hosts', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn().mockResolvedValue({
        stdout: '# Host example.com found\nexample.com ssh-ed25519 AAAA...',
        stderr: '',
        code: 0,
      }),
    };

    const result = await hasKnownHostAsync(context);

    expect(result).toBe(true);
    expect(context.runAsync).toHaveBeenCalledWith(
      'ssh-keygen',
      ['-F', 'example.com'],
      { stdio: expect.any(Array) }
    );

  });

  it('should return false when host is not found', async () => {

    const context: AuthContext = {
      hostname: 'unknown.com',
      runAsync: vi.fn().mockResolvedValue({
        stdout: '',
        stderr: '',
        code: 1,
      }),
    };

    const result = await hasKnownHostAsync(context);

    expect(result).toBe(false);

  });

  it('should return false when ssh-keygen fails', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn().mockRejectedValue(new Error('Command failed')),
    };

    const result = await hasKnownHostAsync(context);

    expect(result).toBe(false);

  });

});

describe('fetchHostKeyAsync', () => {

  it('should fetch and return host key with fingerprint', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        .mockResolvedValueOnce({
          stdout: '|1|hash1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest\n',
          stderr: '',
          code: 0,
        })
        .mockResolvedValueOnce({
          stdout: '256 SHA256:TestFingerprint comment\n',
          stderr: '',
          code: 0,
        }),
    };

    const result = await fetchHostKeyAsync(context);

    expect(result).toEqual({
      type: 'ssh-ed25519',
      entry: '|1|hash1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest',
      fingerprint: 'SHA256:TestFingerprint',
    });
    expect(context.runAsync).toHaveBeenCalledWith(
      'ssh-keyscan',
      ['-t', 'ssh-ed25519,ecdsa-sha2-nistp256,ssh-rsa', '-HT5', 'example.com'],
      { stdio: expect.any(Array) }
    );

  });

  it('should select the highest priority key when multiple types are available', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        .mockResolvedValueOnce({
          stdout: [
            '|1|hash1 ssh-rsa AAAAB3NzaC1yc2EAAAATest',
            '|1|hash2 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest',
          ].join('\n'),
          stderr: '',
          code: 0,
        })
        .mockResolvedValueOnce({
          stdout: '2048 SHA256:RSAFingerprint comment\n',
          stderr: '',
          code: 0,
        })
        .mockResolvedValueOnce({
          stdout: '256 SHA256:ED25519Fingerprint comment\n',
          stderr: '',
          code: 0,
        }),
    };

    const result = await fetchHostKeyAsync(context);

    // ssh-ed25519 has higher priority than ssh-rsa
    expect(result?.type).toBe('ssh-ed25519');
    expect(result?.fingerprint).toBe('SHA256:ED25519Fingerprint');

  });

  it('should skip comment lines starting with #', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        .mockResolvedValueOnce({
          stdout: [
            '# example.com:22 SSH-2.0-OpenSSH_8.2p1',
            '|1|hash1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest',
          ].join('\n'),
          stderr: '',
          code: 0,
        })
        .mockResolvedValueOnce({
          stdout: '256 SHA256:TestFingerprint comment\n',
          stderr: '',
          code: 0,
        }),
    };

    const result = await fetchHostKeyAsync(context);

    expect(result?.type).toBe('ssh-ed25519');

  });

  it('should skip entries with invalid format', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        .mockResolvedValueOnce({
          stdout: [
            'invalid-entry',
            '|1|hash1 ssh-ed25519',
            '|1|hash2 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest',
          ].join('\n'),
          stderr: '',
          code: 0,
        })
        .mockResolvedValueOnce({
          stdout: '256 SHA256:TestFingerprint comment\n',
          stderr: '',
          code: 0,
        }),
    };

    const result = await fetchHostKeyAsync(context);

    expect(result?.type).toBe('ssh-ed25519');

  });

  it('should skip keys with unsupported types', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        .mockResolvedValueOnce({
          stdout: '|1|hash1 ssh-dss AAAAB3NzaC1kc3MAAACTest\n',
          stderr: '',
          code: 0,
        }),
    };

    const result = await fetchHostKeyAsync(context);

    expect(result).toBeUndefined();

  });

  it('should skip keys with invalid fingerprint format', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        .mockResolvedValueOnce({
          stdout: '|1|hash1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest\n',
          stderr: '',
          code: 0,
        })
        .mockResolvedValueOnce({
          stdout: '256 MD5:invalid comment\n',
          stderr: '',
          code: 0,
        }),
    };

    const result = await fetchHostKeyAsync(context);

    expect(result).toBeUndefined();

  });

  it('should return undefined when ssh-keyscan fails', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn().mockRejectedValue(new Error('Connection refused')),
    };

    const result = await fetchHostKeyAsync(context);

    expect(result).toBeUndefined();

  });

  it('should return undefined when no valid keys are found', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn().mockResolvedValue({
        stdout: '',
        stderr: '',
        code: 0,
      }),
    };

    const result = await fetchHostKeyAsync(context);

    expect(result).toBeUndefined();

  });

});

describe('addToKnownHostsAsync', () => {

  it('should create ssh directory and append key to known_hosts', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn().mockResolvedValue({
        stdout: '',
        stderr: '',
        code: 0,
      }),
    };

    const hostKey = {
      type: 'ssh-ed25519' as const,
      entry: '|1|hash1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest',
      fingerprint: 'SHA256:TestFingerprint',
    };

    await addToKnownHostsAsync(hostKey, context);

    expect(context.runAsync).toHaveBeenCalledWith(
      'mkdir',
      ['-p', expect.stringContaining('.ssh')],
      { stdio: expect.any(Array) }
    );
    expect(context.runAsync).toHaveBeenCalledWith(
      'tee',
      ['-a', expect.stringContaining('known_hosts')],
      {
        stdio: expect.any(Array),
        input: `${hostKey.entry}\n`,
      }
    );

  });

});

describe('confirmHost', () => {

  beforeEach(() => {

    vi.clearAllMocks();

  });

  it('should return early when host is already known', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn().mockResolvedValue({
        stdout: '# Host found',
        stderr: '',
        code: 0,
      }),
    };

    await confirmHost(context);

    expect(context.runAsync).toHaveBeenCalledTimes(1);
    expect(prompts).not.toHaveBeenCalled();

  });

  it('should prompt user and add host when user confirms trust', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        // hasKnownHostAsync - not found
        .mockResolvedValueOnce({ stdout: '', stderr: '', code: 1 })
        // fetchHostKeyAsync - ssh-keyscan
        .mockResolvedValueOnce({
          stdout: '|1|hash1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest',
          stderr: '',
          code: 0,
        })
        // fetchHostKeyAsync - fingerprint
        .mockResolvedValueOnce({
          stdout: '256 SHA256:TestFingerprint comment',
          stderr: '',
          code: 0,
        })
        // addToKnownHostsAsync - mkdir
        .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 })
        // addToKnownHostsAsync - tee
        .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }),
    };

    vi.mocked(prompts).mockResolvedValue({ canAddToKnown: true });

    await confirmHost(context);

    expect(logger.warn).toHaveBeenCalledWith([
      'Host example.com is untrusted\n',
      'Key type: ssh-ed25519\n',
      'Fingerprint: SHA256:TestFingerprint',
    ]);
    expect(prompts).toHaveBeenCalledWith({
      type: 'toggle',
      name: 'canAddToKnown',
      message: 'Do you trust this host?',
      initial: false,
      active: 'Yes',
      inactive: 'No',
    });
    expect(context.runAsync).toHaveBeenCalledWith(
      'tee',
      expect.any(Array),
      expect.objectContaining({
        input: '|1|hash1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest\n',
      })
    );

  });

  it('should throw OperationCanceledError when user declines trust', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        .mockResolvedValueOnce({ stdout: '', stderr: '', code: 1 })
        .mockResolvedValueOnce({
          stdout: '|1|hash1 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAITest',
          stderr: '',
          code: 0,
        })
        .mockResolvedValueOnce({
          stdout: '256 SHA256:TestFingerprint comment',
          stderr: '',
          code: 0,
        }),
    };

    vi.mocked(prompts).mockResolvedValue({ canAddToKnown: false });

    await expect(confirmHost(context)).rejects.toThrow(OperationCanceledError);
    expect(logger.warn).toHaveBeenCalled();
    expect(prompts).toHaveBeenCalled();

  });

  it('should throw error when unable to fetch host key', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        .mockResolvedValueOnce({ stdout: '', stderr: '', code: 1 })
        .mockRejectedValueOnce(new Error('Connection timeout')),
    };

    await expect(confirmHost(context)).rejects.toThrow('Unable to fetch host public key');
    expect(prompts).not.toHaveBeenCalled();

  });

  it('should throw error when fetched key is undefined', async () => {

    const context: AuthContext = {
      hostname: 'example.com',
      runAsync: vi.fn()
        .mockResolvedValueOnce({ stdout: '', stderr: '', code: 1 })
        .mockResolvedValueOnce({ stdout: '', stderr: '', code: 0 }),
    };

    await expect(confirmHost(context)).rejects.toThrow('Unable to fetch host public key');

  });

});
