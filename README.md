# raodotask

# Project Description

User Management Rest APIs

# Features

# /user/signup:User Signup[POST]

inputs- firstName, lastName, username, gender,email, mobile, password<br>
methods-validate the inputs<br>
on successful validation, save the user to MongoDB.<br>
return- success response

# /user/login:User Signin[POST]

inputs- username, password<br>
methods-validate the inputs<br>
on successful validation, generate token.<br>
return- generated token

# /user/details:Get user details if user is authenticated[GET]

inputs- accepts a header token<br>
methods- authenticate user<br>
if authenticated, fetch user details from MongoDB<br>
return- user details


# /user/forgotPassword:User forget password[POST]

inputs-email<br>
method- generate 6 digit verification code<br>
return- send generated code through mail

# /user/verifyCode:Verify code sent to email[POST]

inputs-email,code and header token<br>
methods- validate the user and generate a token<br>
return- generated token

# /user/changePassword:Change Password[POST]

inputs-new password<br>
method- authenticate user<br>
if authenticated, new password is saved to db<br>
return- success message, if success otherwie error

# /user/signout:Signout user[GET]

inputs- header token<br>
methods- authenticate user<br>
invalidate the token<br>
return- success message

# Pre-Requisites

- Node.js should be installed.
- MongoDB should be installed.
- NPM should be installed.
- Sendgrid Username and Password should be there.

# App Installation

Setting up local server 

- First run the local mongodb server, then add config.json inside server->configs with all the environment variables like PORT, JWT_SECRET,MONGODB_URI,MSG91_AUTHKEY, SENDGRID_USER and SENDGRID_SECRET to send emails.
- Download the code from github.
- Unzip the folder
- Open command prompt from the unzipped folder
- Run command: npm install to install all the packages
- Run command: node server/server.js
- The local server will start with the mentioned port

# How to use the app

Using Postman, the APIs can be tested.

# Developed with:
- MongoDB
- ExpressJS
- NodeJS
- Postman

# Developed By:

Anuradha Sahoo
