import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  constructor(private titleService: Title, private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateTitle(event.urlAfterRedirects);
      }
    });
  }

  updateTitle(url: string) {
    const titles: { [key: string]: string } = {
      '/login': 'Login | DevUsui',
      '/panel': 'Dashboard | DevUsui'
    };

    this.titleService.setTitle(titles[url] || 'DevUsui');
  }
}
