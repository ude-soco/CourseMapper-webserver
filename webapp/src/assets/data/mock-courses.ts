import {Course} from './Course';

export const courses: Course[] = [
  {
    course: 'Advanced Web Technologies',
    shortName: 'AWT',
    lessons: [
      {
        topic: 'React',
        channels: [
          {
            name: 'React Part 1 ',
            description: 'Welcome to React Part 1',
          },
          {
            name: 'React Part 2',
            description: 'Welcome to React Part 2',
          }
        ]
      },
      {
        topic: 'Angular',
        channels: [
          {
            name: 'Angular Part 1',
            description: 'Welcome to Angular Part 1',
          },
          {
            name: 'Angular Part 2',
            description: 'Welcome to Angular Part 2',
          }]
      },
    ]
  },
  {
    course: 'Learning Analytics',
    shortName: 'LA',
    lessons: [
      {
        topic: 'Big Data',
        channels: [
          {
            name: 'Big Data',
            description: 'Welcome to Big Data'
          }
        ]
      }
    ]
  }
];
