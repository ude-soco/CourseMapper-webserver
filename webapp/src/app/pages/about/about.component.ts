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
      image: '/assets/features/Learningchanels1.png',
      description: 'Learning channels in CourseMapper provide a structured way to manage different topics and learning materials within a course. Learning channels are custimzable collaborative learning spaces created for each topic in the course, where learners can collaboratively annotate learning materials, discuss them with other course participants, and share related learning resources. The evaluation results showed that learning channels have the potential to support effective interaction and collaboration in CourseMapper.',
    },
    {
      title: 'PDF and Video Annotations',
      image: '/assets/features/annotations1.png',
      description: 'In each learning channel, learner can use different annotation tools (i.e., highlight, draw, pinpoint) to mark specific parts of the learning mateiral and create different types of annotations (i.e., note, question, or external resource). They can also add annotations to a specific page of a PDF and for a specified time spoan on a video learning resource. These added annotations then appear in the discussion panel underneath the learning material, categorized with different colors based on the annotation type.',
    },
    {
      title: 'Educational Knowledge Graphs',
      image: '/assets/features/edukg1.png',
      description: 'Educational Knowledge Graphs (EduKG) are costructed for learning mateirials and courses in CourwseMapper to provide learners with an overview of the covered concepts and the relationships between the same, thus helping learners in their learning process. The EduKGs are further used to model learners based on their activities in the course and generate recommendations of related concepts and relevant learning resources. This helps in saving learners\' additional effort that they might spend in searching for additional resources to understand a concept.',
    },
    {
      title: 'GNN-based Learner Modeling',
      image: '/assets/features/learnermodel1.png',
      description: 'With every PDF learning material, there is a Did Not Understand (DNU) button at the bottom. When clicked, learners can see a local EduKG consisting of the top 5 main concepts extracted from the content of the current page. Learners can then mark the concept(s) they do not understand in this EduKG. In this way, they inform the system about their current knowledge state. This and other learners interactions with the platform are used to build accurate learner models using Graph Neural Networks (GNNs).',
    },
    {
      title: 'Recommendation of External Learning Resources',
      image: '/assets/features/recommendation1.png',
      description: 'Learners can construct their personal knowledge graphs (PKGs) based on the knowledge concepts that they did not understand while interacting with learning materials in CourseMapper. These PKGs are then leveraged to generate personalized recommendations of external learning resources including YouTube videos and Wikipedia articles.',
    },
    {
      title: 'Transparent Recommendation of Knowledge Concepts',
      image: '/assets/features/concept1.png',
      description: 'PKG-based learner models are also used to generate personalized recommendations of related knowledge concepts, using Graph Convolutional Networks (GCNs) and pre-trained transformer language model encoders. To increase transparency, explanations of the recommended concepts are provided using the structural and semantic information in the EduKG.',
    },
  ]

  constructor(
    private storageService: StorageService,
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();
  }
}
