const got = require('got');
const fs = require('fs');
const path = require('path');
const FeedParser = require('feedparser');
const FlickrPhoto = require('flickr-photo-url')

async function getIOTDData(cb) {
  const response = await got.stream('https://www.nasa.gov/rss/dyn/lg_image_of_the_day.rss');

  var feedparser = new FeedParser();
  response.pipe(feedparser);

  var obj = {};

  feedparser.on('error', function(error) {
    throw error;
  });

  var first = true;
  feedparser.on('readable', function() {
    var stream = this,
      item;
    while (item = stream.read()) {
      if (first) {
        var obj = {};
        obj.imageURL = item.enclosures[0].url;
        obj.imageView = item.link;
        cb(obj);
      }
      first = false;
    }
  });
}

async function getEOData(cb) {
  const response = await got.stream('https://earthobservatory.nasa.gov/feeds/image-of-the-day.rss');

  var feedparser = new FeedParser();
  response.pipe(feedparser);

  var obj = {};

  feedparser.on('error', function(error) {
    throw error;
  });

  var first = true;
  feedparser.on('readable', function() {
    var stream = this,
      item;
    while (item = stream.read()) {
      if (first) {
        var obj = {};
        obj.imageURL = item.image.url;
        obj.imageView = item.link;
        cb(obj);
      }
      first = false;
    }
  });
}

async function getAPODData() {
  const response = await got.get('https://api.nasa.gov/planetary/apod?api_key=' + process.env['nasa_api_key']);
  const response_object = JSON.parse(response.body);
  var obj = {};

  // Prefer the HD image if available
  if (typeof response_object.hdurl !== 'undefined' && response_object.hdurl) {
    obj.imageURL = response_object.hdurl;
  } else {
    obj.imageURL = response_object.url;
  }

  // Format the URL, as long as the API doesn't change it's URL scheme, this should stay working
  obj.imageView = 'https://apod.nasa.gov/apod/ap' + response_object.date.charAt(0) + response_object.date.charAt(1) + response_object.date.charAt(5) + response_object.date.charAt(6) + response_object.date.charAt(8) + response_object.date.charAt(9) + '.html';

  return obj;
}

async function getSpaceXData(cb) {
  const response = await got.stream('https://api.flickr.com/services/feeds/photos_public.gne?id=130608600@N05&lang=en-us&format=rss_200');

  var feedparser = new FeedParser();
  response.pipe(feedparser);

  var obj = {};

  feedparser.on('error', function(error) {
    throw error;
  });

  var items = [];
  feedparser.on('readable', function() {
    var stream = this,
      item;
    while (item = stream.read()) {
      items.push(item);
    }
  });

  feedparser.on('end', function() {
    const item = items[Math.floor(Math.random() * items.length)];
    const photo_id = parseInt(item.link.substring(37, item.link.length - 1));
    FlickrPhoto('spacex', photo_id, FlickrPhoto.sizes.original)
      .catch(console.error).then((imageURL) => {
        var obj = {};
        obj.imageView = item.link;
        obj.imageURL = imageURL;

        cb(obj);
      });
  });
}

async function runMain() {
  // Create required directories
  if (!fs.existsSync(path.join(__dirname, 'build'))) {
    fs.mkdirSync(path.join(__dirname, 'build'));
  }
  if (!fs.existsSync(path.join(__dirname, 'build', 'meteoroid_api'))) {
    fs.mkdirSync(path.join(__dirname, 'build', 'meteoroid_api'));
  }

  // Source 1 - NASA (IOTD)
  getIOTDData(function(IOTD_Object) {
    fs.writeFile(path.join(__dirname, 'build', 'meteoroid_api', 'source1.json'), JSON.stringify(IOTD_Object), {
      flag: 'w'
    }, function(err) {
      if (err) throw err;
      console.log('source1.json has been successfully written');
    });
  });

  // Source 2 - NASA (EO)
  getEOData(function(EO_Object) {
    fs.writeFile(path.join(__dirname, 'build', 'meteoroid_api', 'source2.json'), JSON.stringify(EO_Object), {
      flag: 'w'
    }, function(err) {
      if (err) throw err;
      console.log('source2.json has been successfully written');
    });
  });

  // Source 3 - NASA (APOD)
  const APOD_Object = await getAPODData();
  fs.writeFile(path.join(__dirname, 'build', 'meteoroid_api', 'source3.json'), JSON.stringify(APOD_Object), {
    flag: 'w'
  }, function(err) {
    if (err) throw err;
    console.log('source3.json has been successfully written');
  });

  // Source 4 - SpaceX
  getSpaceXData(function(SpaceX_Object) {
    fs.writeFile(path.join(__dirname, 'build', 'meteoroid_api', 'source4.json'), JSON.stringify(SpaceX_Object), {
      flag: 'w'
    }, function(err) {
      if (err) throw err;
      console.log('source4.json has been successfully written');
    });
  });
}

runMain();
