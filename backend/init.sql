/*A executer une seule fois*/
CREATE DATABASE FlexiLearn;
CREATE USER admin WITH PASSWORD 'admin';
GRANT ALL PRIVILEGES ON DATABASE flexilearn TO admin;
ALTER DATABASE flexilearn OWNER TO admin;
GRANT ALL ON SCHEMA public TO admin;
ALTER SCHEMA public OWNER TO admin;
