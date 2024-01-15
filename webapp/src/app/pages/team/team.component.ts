import { Component } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';

interface Person {
  name: string,
  url: string,
  email?: string,
  image: string,
}

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent {
  loggedInUser: boolean = false;

  people: Person[] = [
    {
      name: 'Prof. Dr. Mohamed Amine Chatti',
      url: 'https://www.uni-due.de/soco/people/mohamed-chatti.php',
      image: '/assets/people/mohamed_chatti.jpg',
    },
    {
      name: 'M. Sc. Qurat Ul Ain',
      url: 'https://www.uni-due.de/soco/people/qurat-ain.php',
      email: 'qurat.ain@stud.uni-due.de',
      image: '/assets/people/qurat_ain.jpg',
    },
    {
      name: 'M. Sc. Rawaa Alatrash',
      url: 'https://www.uni-due.de/soco/people/rawaa-alatrash.php',
      email: 'rawaa.alatrash@stud.uni-due.de',
      image: '/assets/people/rawaa_alatrash.jpg',
    },
    {
      name: 'M. Sc. Shoeb Joarder',
      url: 'https://www.uni-due.de/soco/people/shoeb-joarder.php',
      image: '/assets/people/shoeb_joarder.jpg',
    },
  ]

  constructor(
    private storageService: StorageService,
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();
  }
}
