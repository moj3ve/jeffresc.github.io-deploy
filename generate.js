// Node.js script to create index.html

// Requirements
const ejs = require('ejs');
const http = require('http');
const {
  Octokit
} = require("@octokit/rest");
const fs = require('fs');
const path = require('path');
var ncp = require('ncp').ncp;

// Initialize Octokit
const octokit = new Octokit();

// Items
const shortlook_providers = require(path.join(__dirname, 'items', 'shortlook_providers.json'));
const tweaks = require(path.join(__dirname, 'items', 'tweaks.json'));
const widgets = require(path.join(__dirname, 'items', 'widgets.json'));

// Generate ShortLook Providers HTML Function
function generate_shortlook_providers_html(cb) {
  var providers = [];
  shortlook_providers.items.forEach(provider => {
    ejs.renderFile(path.join(__dirname, 'templates', 'shortlook-provider-item.ejs'), provider, {}, function(err, str) {
      if (err) throw err;
      providers.push(str);
      if (shortlook_providers.items.length == providers.length) {
        cb(providers.join('\n'));
      }
    });
  });
}

// Generate Tweaks HTML Function
function generate_tweaks_html(cb) {
  var tweaks_array = [];
  tweaks.items.forEach(tweak => {
    ejs.renderFile(path.join(__dirname, 'templates', 'tweak-item.ejs'), tweak, {}, function(err, str) {
      if (err) throw err;
      tweaks_array.push(str);
      if (tweaks.items.length == tweaks_array.length) {
        cb(tweaks_array.join('\n'));
      }
    });
  });
}

// Generate Widgets HTML Function
function generate_widgets_html(cb) {
  var widgets_array = [];
  widgets.items.forEach(widget => {
    ejs.renderFile(path.join(__dirname, 'templates', 'widget-item.ejs'), widget, {}, function(err, str) {
      if (err) throw err;
      widgets_array.push(str);
      if (widgets.items.length == widgets_array.length) {
        cb(widgets_array.join('\n'));
      }
    });
  });
}

// Generate Projects HTML Function
function generate_projects_html(projects, cb) {
  var projects_array = [];
  projects.forEach(project => {
    ejs.renderFile(path.join(__dirname, 'templates', 'project-item.ejs'), project, {}, function(err, str) {
      if (err) throw err;
      projects_array.push(str);
      if (projects.length == projects_array.length) {
        cb(projects_array.join('\n'));
      }
    });
  });
}

function generate_index_html() {
  octokit.repos
    .listForUser({
      username: "JeffResc",
      type: "public"
    })
    .then(({
      data
    }) => {
      data.sort((a, b) => (a.stargazers_count < b.stargazers_count) ? 1 : -1);
      const projects = data.filter(obj => obj.fork == false);
      var html_object = {};
      generate_projects_html(projects, function(projects_html) {
        html_object.projects = projects_html;
        generate_shortlook_providers_html(function(provider_html) {
          html_object.shortlook_providers = provider_html;
          generate_tweaks_html(function(tweak_html) {
            html_object.tweaks = tweak_html;
            generate_widgets_html(function(widget_html) {
              html_object.widgets = widget_html;
              ejs.renderFile(path.join(__dirname, 'templates', 'base.ejs'), {
                projects_section: html_object.projects,
                shortlook_providers_section: html_object.shortlook_providers,
                tweaks_section: html_object.tweaks,
                widgets_section: html_object.widgets
              }, {}, function(err, str) {
                if (err) throw err;
                if (!fs.existsSync(path.join(__dirname, 'build'))) {
                  fs.mkdirSync(path.join(__dirname, 'build'));
                }
                fs.writeFile(path.join(__dirname, 'build', 'index.html'), str, {
                  flag: 'w'
                }, function(err) {
                  if (err) throw err;
                  console.log('index.html has been successfully written');
                });
                ncp(path.join(__dirname, 'static'), path.join(__dirname, 'build'), function(err) {
                  if (err) throw err;
                  console.log('Successfully copied static directory to build directory');
                });
              });
            });
          });
        });
      });
    });
}

generate_index_html();
