# ft_transcendence

## Getting Started

Follow these steps to set up and run the project:

### 1. Build the Project

```bash
make
```

### 2. Access the SQLITE container


1. Check name of `app` image:

	```bash
	docker ps
	```
	You will have two images, one for nginx and another one for app, you should check the NAME for the app one in order to access to it.

	**Note:** In my case the name is `ft_transcendence-app-1`.


2. Access the `app` container:
	```bash
	docker exec -it ft_transcendence-app-1 sh
	```
	**Note:** Change `ft_transcendence-app-1` if the name is different.

3. Access the sqlite inside the container:
	- Go to `data` folder:
		```bash
		cd data
		```
	- Access sqlite
		```bash
		sqlite3 database.sqlite
		```
	- Display the tables
		```bash
		.tables
		```
	- You will see 'players' table. In order to display the list of players:
		```bash
		SELECT * FROM players;
		```
4. Exit sqlite3:

	```bash
	.exit
	```

### 3. Access the application

   Open your browser and go to:  
   [http://localhost](http://localhost)

**Note:** You may need to accept self-signed certificates in your browser to access the application securely.

