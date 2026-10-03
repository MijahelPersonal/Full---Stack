import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DesktopUpdates } from './shared/desktop-updates';

@Component({
  imports: [RouterOutlet, DesktopUpdates],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
