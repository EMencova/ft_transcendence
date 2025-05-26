# ft_transcendence

## Getting Started

Follow these steps to set up and run the project:

### 1. Build the Project

```bash
make
```

### 2. Configure Database User (First Time Only)

After building, you need to grant permissions to the database user specified in your `.env` file.

1. Access the MySQL container:

	```bash
	docker exec -it ft_transcendence-db-1 mysql -u root -p
	```

2. In the MySQL prompt, run the following commands (replace `tu_password` and `ponguser` with the password and user from your `.env`):

	```sql
	CREATE USER 'ponguser'@'%' IDENTIFIED BY 'tu_password';
	GRANT ALL PRIVILEGES ON *.* TO 'ponguser'@'%';
	FLUSH PRIVILEGES;
	```

### 3. Verify User Permissions

To check that the permissions were granted correctly, run:

```sql
SHOW GRANTS FOR 'ponguser'@'%';
```

---

Now you can make again.

### 4. Access the application

   Open your browser and go to:  
   [http://localhost](http://localhost)

**Note:** You may need to accept self-signed certificates in your browser to access the application securely.




**Note:** The volumes will be automatically created in the root in a folder "volumes", inside there are two folders, db-data and frontend. Volumes are not added to the remote repo. 
