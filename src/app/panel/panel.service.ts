import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device } from '../shared/models/device.model';
import { BackupConfig } from '../shared/models/backup-config.model';
import { SSHTestResponse } from '../shared/models/ssh-test-response.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PanelService {
  private apiUrl = environment.apiUrl + "/api/devices"; // ✅ URL del backend

  constructor(private http: HttpClient) {}

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(this.apiUrl); // ✅ Obtener dispositivos desde el backend
  }

  // panel.service.ts
  createDevice(device: Device): Observable<Device> {
    return this.http.post<Device>(`${this.apiUrl}`, device);
  }

  updateDevice(device: Device): Observable<Device> {
    return this.http.put<Device>(this.apiUrl, device);
  }

  deleteDevice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Lanza GET /api/devices/{id}/ssh-test
   * y devuelve { success, message } según el servidor.
   */
  testSSHConnection(device: Device): Observable<SSHTestResponse> {
    return this.http.get<SSHTestResponse>(
      `${this.apiUrl}/${device.id}/ssh-test`
    );
  }

  saveBackupConfig(config: BackupConfig): Observable<BackupConfig> {
    return this.http.put<BackupConfig>(
      `${this.apiUrl}/backup-config`,
      config
    );
  }

  /** Obtiene la configuración actual de backup */
  getBackupConfig(): Observable<BackupConfig> {
    return this.http.get<BackupConfig>(
      `${this.apiUrl}/backup-config`
    );
  }
}
