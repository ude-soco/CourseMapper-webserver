import { Component } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';

interface Feature {
  title: string,
  image: string,
  description: string,
}

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  loggedInUser: boolean = false;

  features: Feature[] = [
    {
      title: 'Learning Channels',
      image: '/assets/features/learning-channels.png',
      description: 'Learning channels in CourseMapper provide a structured way to manage different topics and learning materials within a course. Learning channels are custimzable collaborative learning spaces created for each topic in the course, where learners can collaboratively annotate learning materials, discuss them with other course participants, and share related learning resources. The evaluation results showed that learning channels have the potential to support effective interaction and collaboration in CourseMapper.',
    },
    {
      title: 'PDF and Video Annotations',
      image: '/assets/features/annotation.png',
      description: 'In each learning channel, learner can use different annotation tools (i.e., highlight, draw, pinpoint) to mark specific parts of the learning mateiral and create different types of annotations (i.e., note, question, or external resource). They can also add annotations to a specific page of a PDF and for a specified time spoan on a video learning resource. These added annotations then appear in the discussion panel underneath the learning material, categorized with different colors based on the annotation type.',
    },
    {
      title: 'Educational Knowledge Graphs',
      image: '/assets/features/edukg.png',
      description: 'Educational Knowledge Graphs (EduKG) are costructed for learning mateirials and courses in CourwseMapper to provide learners with an overview of the covered concepts and the relationships between the same, thus helping learners in their learning process. The EduKGs are further used to model learners based on their activities in the course and generate recommendations of related concepts and relevant learning resources. This helps in saving learners\' additional effort that they might spend in searching for additional resources to understand a concept.',
    },
    {
      title: 'User Modeling and Recommendation',
      image: '/assets/features/recommendation.png',
      description: 'With every PDF learning material, there is a Did Not Understand (DNU) button at the bottom. When clicked, learners can see a local EduKG consisting of the top 5 main concepts extracted from the content of the current page. Learner can then mark the concept(s) they do not understand in this EduKG. In this way, they inform the system about their current knowledge state. This and other learners\' interactions with the platform are used to build accurate learner model sand generate personalized recommendations of related concepts and external learning resource, using Graph Neural Networks (GNNS).',
    },
  ]

  constructor(
    private storageService: StorageService,
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();
  }
}
