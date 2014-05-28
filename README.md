# WP API Developer Console

An open source version of https://developer.wordpress.com/docs/api/console/ that
works with WP API.

## Setting Up

### Step 1: Creating a Consumer
Once you have WP API and the OAuth server plugins activated on your server,
you'll need to create a "consumer". This is an identifier for the application,
and includes a "key" and "secret", both needed to link to your site.

To create the consumer, run the following **on your server**:
```bash
$ wp oauth1 add

ID: 4
Key: sDc51JgH2mFu
Secret: LnUdIsyhPFnURkatekRIAUfYV7nmP4iF3AVxkS5PRHPXxgOW
```

Note the key and secret returned here. You'll need those in a moment.

### Step 2: Save your configuration
Time to link the console to your site. Copy `config.sample.json` to
`config.json` and begin editing. You'll need to set all options in there, and
your `api_url` setting should point to your API install without the
trailing slash:

```json
{
    "api_url": "http://example.com/wp-json",
    "client_key": "sDc51JgH2mFu",
    "client_secret": "LnUdIsyhPFnURkatekRIAUfYV7nmP4iF3AVxkS5PRHPXxgOW"
}
```

Replace `http://example.com/` with the site you're running WP API on.

### Step 3: Run it!
Open the console in your browser. You should see routes appear in the top left
of your screen. (If these are missing, your `api_url` is set incorrectly.)

To make authenticated requests, simply hit the **Auth** button and follow the
steps on-screen!

## Credits
* Uses code based on OpenStreetMap's [osm-auth][]. Licensed under the public
  domain.
* Originally based on the open source version of
  [WordPress.com's API Console][wpcom-console]. Major thanks to Automattic and
  developers for releasing this.

[osm-auth]: https://github.com/osmlab/osm-auth
[wpcom-console]: https://github.com/Automattic/rest-api-console