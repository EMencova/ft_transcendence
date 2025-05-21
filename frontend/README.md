## Running the Frontend with Docker

Follow these steps to build and run the frontend using the provided Dockerfile:

1. **Build the Docker image**

   Open a terminal in the `frontend` directory and run:
   ```bash
   docker build -t frontend .
   ```

2. **Run the Docker container**

   To start the container and map port 5123 on your machine to port 80 inside the container, run:
   ```bash
   docker run -d -p 5123:80 --name transcendence frontend
   ```

3. **Access the application**

   Open your browser and go to:  
   [http://localhost:5123](http://localhost:5123)

4. **Stopping and removing the container**

   To stop the container:
   ```bash
   docker stop transcendence
   ```

   To remove the container:
   ```bash
   docker rm transcendence
   ```

**Note:**  
Make sure Docker is installed and running on your system before executing these commands.