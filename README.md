# ChatTherama

A modern chat application built with Angular and deployed on AWS S3 with CloudFront.

## Features

- Real-time chat interface
- Responsive design
- Deployed on AWS S3 with CloudFront CDN
- CI/CD with GitHub Actions

## Prerequisites

- Node.js 20.x
- npm 9.x or later
- AWS Account with S3 and CloudFront access

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Open `http://localhost:4200` in your browser

## Deployment

This project is set up for automatic deployment to AWS S3 using GitHub Actions. To deploy:

1. Set up the following GitHub Secrets:
   - `AWS_ACCESS_KEY_ID_GLOBAL`
   - `AWS_SECRET_ACCESS_KEY_GLOBAL`
   - `AWS_REGION`
   - `S3_BUCKET`
   - `CLOUDFRONT_DISTRIBUTION_ID` (if using CloudFront)

2. Push to the `main` branch to trigger automatic deployment

## Environment Configuration

- Development: `environment.ts`
- Production: `environment.prod.ts`

## Built With

- [Angular](https://angular.io/) - The web framework used
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- [AWS S3](https://aws.amazon.com/s3/) - For static website hosting
- [CloudFront](https://aws.amazon.com/cloudfront/) - For CDN

## License

This project is licensed under the MIT License

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
