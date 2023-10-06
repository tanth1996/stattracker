$ .\gradlew build

$ docker build -t stattracker .

$ docker run -v stattracker-volume:/app/tmpdb -p 8080:8080 -p 9000:9000 stattracker