import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../shared/services/auth-service';
import { catchError, tap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: 'login.scss',
  standalone: true,
  imports: [ReactiveFormsModule]
})
export class Login implements AfterViewInit, OnDestroy {
  @ViewChild('cyberCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private nodes: any[] = [];
  private animationId!: number;
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (!this.loginForm.valid) return;

    const { username, password } = this.loginForm.value;

    this.authService
      .login(username, password)
      .pipe(
        tap({
          next: ({ token, error }) => {
            if (token) {
              this.authService.setToken(token);
              this.errorMessage = '';
              this.router.navigate(['/panel']);
            } else {
              this.errorMessage = error || 'ERROR EN LA AUTENTICACIÓN';
            }
          },
          error: err => {
            this.errorMessage = err.error?.error || 'ERROR DESCONOCIDO';
          }
        })
      )
      .subscribe();
  }

  ngAfterViewInit() {
    this.initCanvas();
    this.createNodes();
    this.animate();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  private createNodes() {
    for (let i = 0; i < 30; i++) {
      this.nodes.push({
        x: Math.random() * this.ctx.canvas.width,
        y: Math.random() * this.ctx.canvas.height,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
        radius: Math.random() * 3 + 1
      });
    }
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Dibujar nodos y conexiones
    this.drawNetwork();

    // Mover nodos
    this.updateNodes();

    // Lluvia digital
    this.drawDigitalRain();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private drawNetwork() {
    // Dibujar conexiones
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(0, 247, 255, ${1 - dist/150})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
          this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
          this.ctx.stroke();
        }
      }
    }

    // Dibujar nodos
    this.nodes.forEach(node => {
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(0, 247, 255, 0.8)';
      this.ctx.fill();
    });
  }

  private updateNodes() {
    this.nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;

      // Rebotar en bordes
      if (node.x < 0 || node.x > this.ctx.canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > this.ctx.canvas.height) node.vy *= -1;
    });
  }

  private drawDigitalRain() {
    // Líneas verticales aleatorias
    if (Math.random() > 0.95) {
      this.ctx.beginPath();
      const x = Math.random() * this.ctx.canvas.width;
      const length = Math.random() * 30 + 10;
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, length);
      this.ctx.strokeStyle = 'rgba(0, 247, 255, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }
}
