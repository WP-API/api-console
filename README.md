
WordPress.com REST API Developer Console
================

An open source version of https://developer.wordpress.com/docs/api/console/ that you can run yourself. Uses implicit OAuth for authentication.
The console requires a WordPress.com application to be created.

## Configuring the console

### Create an Application

1. Login to WordPress.com
2. Visit https://developer.wordpress.com/apps/
3. Click "Create New Application"
4. Full in your applications name and description
5. Enter a redirect URI for your application. See http://developer.wordpress.com/docs/oauth2/ for more information
6. Enter any domains you plan on accessing the console from in the "Javascript Origins" box
7. Click 'Create'
8. Note the "Client ID" and "Redirect URL" fields

### Provide the console your application setting

Once you have your application credentials you need to create a configuration file for your application.

Wherever you have placed the console (the index.html and assets folder) create a "config.json" file with the following contents:

    {
        "client_id": _CLIENT_ID_,
	    "redirect_uri": "_REDIRECT_URI_"
    }

Replacing _CLIENT_ID with the ID from above and _REDIRECT_URI_ with the URI from above.

You should now be able to load the console and authenticate using the box in the lower right hand corner.