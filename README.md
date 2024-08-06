# Album Recommendation System

This project is an Album Recommendation System built using Flask, GraphQL, and MongoDB. The system scrapes data from the BMAT team page, fetches additional data from the Spotify API, and stores it in MongoDB. The web interface allows users to search for albums, view recommendations, and navigate through paginated results.

## Project Purpose

The goal of this project is to create a web application that provides music album recommendations based on the genres of albums liked by the BMAT Music Innovators team. The application allows users to see which albums are liked by team members and lists similar albums.

**Note:** This project will be live on [https://sametatila.live](https://sametatila.live) for only 30 days and will be shut down on September 13, 2024, at 12.00 pm.

## Features

- **Scraping**: Scrapes data from the BMAT team page.
- **Spotify API**: Fetches album information from the Spotify API.
- **MongoDB**: Stores album data in MongoDB.
- **GraphQL**: Implements GraphQL for querying album data.
- **Flask**: Provides a web interface for searching and viewing albums and recommendations.
- **Pagination**: Implements pagination for album listings and recommendations.

## Technologies Used

- **Web Backend**: Flask
- **API Calls**: GraphQL
- **Database**: MongoDB
- **Scraping**: Requests and BeautifulSoup
- **Album Genre Identification**: Spotify API
- **Continuous Integration/Deployment**: Jenkins
- **Deployment**: Docker and AWS Cloud EC2

## Project Structure

```plaintext
album-recommendation/
├── app/
│   ├── __init__.py             # Flask application initialization
│   ├── models/
│   │   └── album_model.py      # Database models
│   ├── routes/
│   │   ├── graphql_routes.py   # GraphQL route definitions and view functions
│   │   └── main_routes.py      # Main route definitions and view functions
│   ├── schemas/
│   │   └── schema.py           # GraphQL schemas and resolvers
│   ├── static/
│   │   ├── playground.html     # GraphQL ariadne playground
│   │   ├── scripts.js          # Homepage JavaScript for frontend interactivity
│   │   └── styles.css          # Homepage CSS styles
│   ├── templates/
│   │   └── index.html          # Homepage template
├── scripts/
│   ├── bmat_loves.py           # Script to scrape data and insert into MongoDB
│   ├── config.py               # Configuration settings and credentials for scraping
│   └── Dockerfile              # Docker configuration settings for scraping
├── tests/
│   └── test_app.py             # Unit and integration tests
├── .gitignore                  # Git ignore file
├── config.py                   # Configuration settings and credentials
├── Dockerfile                  # Docker configuration settings
├── README.md                   # Project documentation
├── requirements.txt            # Python dependencies
└── run.py                      # Entry point for running the application
```

## Setup

1. **Clone the repository**:
    ```sh
    git clone https://github.com/sametatila/album-recommendation-system.git
    cd album-recommendation
    ```

2. **Create and activate a virtual environment**:
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3. **Install dependencies**:
    ```sh
    pip install -r requirements.txt
    ```

4. **Run the application**:
    ```sh
    flask run
    ```

## Usage

- **Scraping and inserting data**:
    ```sh
    python scripts/bamt_loves.py
    ```

- **Running tests**:
    ```sh
    python -m unittest discover tests
    ```

## Configuration

- The `config.py` file contains credentials and configuration settings for different environments (development, testing, production).

## Deployment

### Flask Build in Docker

To deploy the application using Docker, follow these steps:

1. **Build the Docker image**:
    ```sh
    docker build -t album-recommendation-system .
    ```

2. **Run the Docker container**:
    ```sh
    docker run -d -p 5000:5000 --name album-recommendation-container album-recommendation-system
    ```

3. **Environment Variables**:
    Ensure you configure the necessary environment variables for sensitive information. This can be done by passing them as arguments during the `docker run` command or by using a `.env` file.

4. **Docker Compose** (optional):
    For more complex setups, you can use Docker Compose. Create a `docker-compose.yml` file with the following content:
    ```yaml
    version: '3'
    services:
      web:
        image: album-recommendation-system
        build: .
        ports:
          - "5000:5000"
        environment:
          - YOUR_ENV_VAR=your_value
    ```

5. **Run with Docker Compose**:
    ```sh
    docker-compose up -d
    ```

### Jenkins Setup in Docker

1. **Run Jenkins in Docker**:
    ```sh
    docker run -d --name jenkins --user root -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock -v /usr/bin/docker:/usr/bin/docker jenkins/jenkins:lts-jdk17
    ```

2. **Install Docker Plugin in Jenkins**:
    - Access Jenkins at `http://localhost:8080`.
    - Go to Jenkins Dashboard > Manage Jenkins > Manage Plugins.
    - Search for "Docker Pipeline" and install the necessary Docker plugins.

3. **Create a Jenkins Pipeline**:
    - Create a new Pipeline job in Jenkins.
    - In the Pipeline configuration, define your pipeline script from `scripts/jenkinsfile`.

4. **Configure Environment Variables**:
    Ensure you configure any necessary environment variables in Jenkins. This can be done in the Jenkins job configuration under "Build Environment" or passed directly in the pipeline script.

5. **Trigger Builds**:
    - Manually trigger a build in Jenkins to test the pipeline.
    - Optionally, configure webhooks or periodic triggers to automate the build and deployment process.
    ```groovy
    triggers {
        cron('H 0 * * *')
    }
    ```

This setup ensures that the application is containerized and can be easily deployed across different environments.

## Nginx Configuration
Add `include /etc/nginx/sites-enabled/*;` in `/etc/nginx/nginx.conf` for symbolic link
```nginx
http{
    ...
    include /etc/nginx/sites-enabled/*;
    ...
}
```

To set up Nginx as a reverse proxy for your application, add the following configuration to your `/etc/nginx/sites-available/your-domain-name` file:

```nginx
server {
    listen 80;
    server_name your-domain-name www.your-domain-name;
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain-name www.your-domain-name;
    ssl_certificate /etc/nginx/ssl/your-ssl-certificate.crt;
    ssl_certificate_key /etc/nginx/ssl/your-ssl-certificate-key.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /jenkins/ {
        proxy_pass http://localhost:8080/jenkins/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

To enable the congifuration file
```sh
sudo ln -s /etc/nginx/sites-available/sametatila.live /etc/nginx/sites-enabled/
```

Then
```sh
sudo systemctl restart nginx
```

This configuration sets up Nginx to redirect HTTP to HTTPS, proxy requests to the Flask application running on port 5000, and proxy Jenkins requests to port 8080.