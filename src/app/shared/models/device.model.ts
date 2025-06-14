export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  type: string;
  username: string;
  password: string;
  sshPort: number;
  version: number;
}
