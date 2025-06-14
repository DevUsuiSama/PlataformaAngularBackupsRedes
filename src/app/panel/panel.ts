import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Device } from '../shared/models/device.model';
import { PanelService } from './panel.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../shared/services/auth-service';
import { catchError, delay, EMPTY } from 'rxjs';
import { BackupConfig } from '../shared/models/backup-config.model';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.html',
  styleUrls: ['./panel.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class Panel implements AfterViewInit {
  @ViewChild('cyberCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private nodes: any[] = [];
  private animationId!: number;

  private loadBackupConfig(): void {
    this.panelService.getBackupConfig().pipe(
      catchError(err => {
        this.showAlertMessage('No se pudo cargar la configuración', 'error');
        return EMPTY;
      })
    )
    .subscribe(cfg => this.backupConfig = cfg);
  }

  isOpen = false;
  showAlert = false;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';
  confirmMessage = '';
  confirmType = 'question';
  showConfirm = false;
  confirm!: (result: boolean) => void;

  isLoading = false;
  loadingMessage = '';
  progressVisible = false;

  devices: Device[] = [];
  selectedDevice: Device | null = null;
  pendingDevice: Device | null = null;
  showPendingDevice = false;

  backupConfig: BackupConfig = {
    frequency: 'daily',
    time: '08:00',
    weeklyDay: 'monday',
    monthlyDay: '1',
    localFolder: 'C:/backups/'
  };
  showPassword = false;

  constructor(
    private panelService: PanelService,
    private cdRef: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngAfterViewInit(): void {
    this.loadDevices();
    this.loadBackupConfig();
  }

  startLoading(operation: string): void {
    this.loadingMessage = operation;
    this.isLoading = true;
    this.progressVisible = false;
  }

  stopLoading(): void {
    this.isLoading = false;  // 🔹 Oculta el loading después de un tiempo
    this.progressVisible = false; // 🔹 Oculta la barra tras completarse
    this.loadingMessage = ''; // 🔹 Limpia el mensaje
  }

  loadDevices(): void {
    this.panelService.getDevices().subscribe({
      next: (devices) => {
        this.devices = devices;
        if (devices.length > 0) {
          this.selectDevice(devices[0]);
        }
      },
      error: (err) => this.authService.logout()
    });
  }

  selectDevice(device: Device): void {
    if (this.pendingDevice && device.id !== this.pendingDevice.id) {
      this.pendingDevice = null;
      this.showPendingDevice = false;
    }
    this.selectedDevice = device;
    this.loadBackupConfig();
  }

  addNewDevice(): void {
    if (!this.pendingDevice) {
      this.pendingDevice = {
        id: Math.random().toFixed(5),  // ID temporal
        name: 'Nuevo Dispositivo',
        ipAddress: '192.168.1.1',
        type: 'Cisco',
        username: 'admin',
        password: 'admin123',
        sshPort: 22,
        version: 0                 // ← inicializo la versión a 0
      };
      this.showPendingDevice = true;
      this.selectDevice(this.pendingDevice);
    }
  }

  saveDevice(): void {
    if (!this.selectedDevice) {
      this.showAlertMessage('No hay un dispositivo seleccionado', 'error');
      return;
    }

    // 1️⃣ Detectar si es creación real o edición
    const isNew =
      !!this.pendingDevice &&
      this.selectedDevice.id === this.pendingDevice.id;

    // 2️⃣ Validar campos obligatorios
    const { id, name, ipAddress, type, username, password, sshPort, version } = this.selectedDevice;
    if (!id || !name.trim() || !ipAddress.trim() ||
      !type.trim() || !username.trim() || !password.trim() || !sshPort) {
      this.showAlertMessage('Todos los campos son obligatorios.', 'error');
      return;
    }

    //  ➡️ Bloquear guardado si el nombre sigue siendo el placeholder
    if (name === 'Nuevo Dispositivo') {
      this.showAlertMessage('Debe asignar un nombre válido antes de guardar', 'error');
      return;
    }

    // 3️⃣ Construir el DTO tal como el backend lo espera
    const payload = { id, name, ipAddress, type, username, password, sshPort, version };

    // 4️⃣ Elegir el observable (POST o PUT)
    const op$ = isNew
      ? this.panelService.createDevice(payload)
      : this.panelService.updateDevice(payload);

    // 5️⃣ Ejecutar y capturar errores de 400/500
    op$.pipe(
      catchError((err) => {
        const msg = err.error?.error
          ?? (isNew
            ? 'Error al crear el dispositivo'
            : 'Error al actualizar el dispositivo');
        this.showAlertMessage(msg, 'error');
        this.cdRef.detectChanges();
        return EMPTY;
      })
    ).subscribe((dev: Device) => {
      // 6️⃣ Si era nuevo, agregarlo al array y limpiar pending
      if (isNew) {
        this.devices = [...this.devices, dev];
        this.pendingDevice = null;
        this.showPendingDevice = false;
      }
      // 7️⃣ Refrescar lista y notificar éxito
      this.loadDevices();
      this.showAlertMessage('Dispositivo guardado', 'success');
      this.cdRef.detectChanges();
    });
  }

  deleteDevice(): void {
    if (!this.selectedDevice) return;
    this.openConfirm('¿Eliminar este dispositivo?', (result) => {
      if (result && this.selectedDevice) {
        this.panelService.deleteDevice(this.selectedDevice.id).subscribe({
          next: () => {
            this.selectedDevice = null;
            this.loadDevices();
            this.showAlertMessage('Dispositivo eliminado', 'success');
            this.cdRef.detectChanges();
          },
          error: () => {
            this.showAlertMessage('Error al eliminar el dispositivo', 'error');
            this.cdRef.detectChanges();
          }
        });
      }
    });
  }

  testSSHConnection(): void {
    if (!this.selectedDevice) return;

    // 🔹 Muestra el mensaje antes de iniciar la operación
    this.startLoading('Probando conexión SSH...');

    this.panelService.testSSHConnection(this.selectedDevice)
      .subscribe({
        next: ({ success, message }) => {
          this.progressVisible = true;
          this.cdRef.detectChanges();
          setTimeout(() => {
            this.stopLoading();
            this.showAlertMessage(message, success ? 'success' : 'error');
            this.cdRef.detectChanges();
          }, 2000);
        },
        error: () => {
          this.progressVisible = true;
          this.cdRef.detectChanges();
          setTimeout(() => {
            this.stopLoading();
            this.showAlertMessage('Error en conexión SSH', 'error');
            this.cdRef.detectChanges();
          }, 2000);
        }
      });
  }

  saveBackupConfig(): void {
    const {
      frequency,
      time,
      weeklyDay,
      monthlyDay,
      localFolder
    } = this.backupConfig;

    // 1️⃣ Validar frecuencia seleccionada
    if (!frequency) {
      return this.showAlertMessage('Selecciona una frecuencia', 'error');
    }

    // 2️⃣ Validar campo TIME para daily/weekly
    if ((frequency === 'daily' || frequency === 'weekly') && !time) {
      return this.showAlertMessage(
        'Debes indicar la hora de ejecución',
        'error'
      );
    }

    // 3️⃣ Validar WEEKLY_DAY para weekly
    if (frequency === 'weekly' && !weeklyDay) {
      return this.showAlertMessage(
        'Selecciona un día de la semana',
        'error'
      );
    }

    // 4️⃣ Validar MONTHLY_DAY para monthly
    if (frequency === 'monthly') {
      const day = monthlyDay?.toString().trim();
      if (!day) {
        return this.showAlertMessage('Ingresa un día del mes', 'error');
      }
      const num = Number(day);
      if (!num || num < 1 || num > 31) {
        return this.showAlertMessage(
          'El día del mes debe estar entre 1 y 31',
          'error'
        );
      }
    }

    // 5️⃣ Validar RUTA DE ALMACENAMIENTO
    if (!localFolder?.trim()) {
      return this.showAlertMessage(
        'La ruta de almacenamiento es obligatoria',
        'error'
      );
    }

    // 6️⃣ Construir payload solo con campos válidos
    const payload: any = { frequency, localFolder };
    if (frequency === 'daily') {
      payload.time = time;
    }
    if (frequency === 'weekly') {
      payload.time      = time;
      payload.weeklyDay = weeklyDay;
    }
    if (frequency === 'monthly') {
      payload.monthlyDay = monthlyDay;
    }

    // 7️⃣ Enviar al servicio y manejar errores
    this.panelService.saveBackupConfig(payload).pipe(
      catchError(err => {
        const msg = err.error?.error || 'Error al guardar configuración';
        this.showAlertMessage(msg, 'error');
        this.cdRef.detectChanges();
        return EMPTY;
      })
    ).subscribe(saved => {
      this.backupConfig = { ...this.backupConfig, ...saved };
      this.showAlertMessage('Configuración guardada', 'success');
      this.cdRef.detectChanges();
    });
  }

  logout(): void {
    this.authService.logout();
  }

  /* Helpers de UI */
  showAlertMessage(message: string, type: 'success' | 'error') {
    this.alertType = type;
    this.alertMessage = message;
    this.showAlert = true;
    setTimeout(() => this.closeAlert(), 5000);
  }

  closeAlert() {
    this.showAlert = false;
    setTimeout(() => {
      this.alertMessage = null;
      this.cdRef.detectChanges();
    }, 500);
  }

  openConfirm(message: string, callback: (res: boolean) => void) {
    this.confirmMessage = message;
    this.showConfirm = true;
    this.confirm = (res) => {
      this.showConfirm = false;
      this.confirmMessage = '';
      callback(res);
    };
  }

  onFrequencyChange(freq: 'daily'|'weekly'|'monthly') {
    this.backupConfig.frequency = freq;
    switch (freq) {
      case 'daily':
        // sólo time y localFolder válidos
        this.backupConfig.weeklyDay  = '';
        this.backupConfig.monthlyDay = '';
        break;
      case 'weekly':
        // time, weeklyDay y localFolder
        this.backupConfig.monthlyDay = '';
        break;
      case 'monthly':
        // sólo monthlyDay y localFolder
        this.backupConfig.time      = '';
        this.backupConfig.weeklyDay = '';
        break;
    }
  }
}
