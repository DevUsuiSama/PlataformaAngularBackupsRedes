import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-error-component',
  imports: [],
  templateUrl: './error-component.html',
  styleUrl: './error-component.scss'
})
export class ErrorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cyberCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private nodes: any[] = [];
  private animationId!: number;

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
  }

  ngAfterViewInit() {
    this.initCanvas();
    this.createNodes();
    this.animate();
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
          this.ctx.strokeStyle = `rgba(255, 0, 0, ${1 - dist/150})`;
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
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
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
      this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }
}
