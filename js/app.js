  jQuery( document ).ready(function( $ ) {

    var wpConsole = wpConsole || {};

    $.ajax( { url: 'config.json' } ).done(  function( config ) {

    wpConsole.access_token = $.cookie('access_token');
    wpConsole.site_id = $.cookie('site_id');
    var params = QueryStringToHash( location.hash.substr(1) );

    if ( params.access_token ) {
      $.cookie('access_token', params.access_token );
      $.cookie('site_id', params.site_id );

      wpConsole.access_token = params.access_token;
      wpConsole.site_id = params.site_id;
    }
    var c = config;

    var auth = osmAuth({
      oauth_consumer_key: config.client_key,
      oauth_secret: config.client_secret,
      url: config.api_url,
      urls: {
        request: config.site_url + "/oauth1/request",
        authorize: config.site_url + "/oauth1/authorize",
        access: config.site_url + "/oauth1/access",
      },
      // singlepage: true
    });
    window.auth = auth;

    var signRequest = function (opts) {

    };

    $( '#auth a' ).click( function(e) {
      e.preventDefault();

      auth.authenticate(function() {
        $( '#auth a' ).html( 'Authenticated!' );
      });


      // $.ajax(signRequest({
        // "url": config.api_url + "/oauth1/request",
      // }));

      // window.location = "https://public-api.wordpress.com/oauth1/authorize/?client_id=" + config.client_id + '&redirect_uri=' + encodeURIComponent ( config.redirect_uri ) + '&response_type=token';
    } );

    if ( auth.authenticated() ) {
      $( '#auth a' ).html( 'Authenticated!' );
    }

    var log = $('#requests'), // where the requests are listed
        initialWidth = $.cookie('panelWidth'), // save the width of the left panel
        panel = $('#panel'), // a reference to the left panel
        inputs = $('.inputs'), // all input divs
        resizing = false, // if the user is currently resizing the panel
        canResize = false, // if the user's mouse is in a location where resizing can be activated
        lastX = null, // track the last mouse x position
        resizeDetector = function(e){ // function to detect if the user can activate resizing
          var padding = 5, width = panel.width(), left = width, right = width + padding;
          if (lastX == e.pageX) return;
          lastX = e.pageX;
          if (lastX > left && lastX < right) {
            canResize = true;
            document.body.style.cursor = "ew-resize !important";
          } else {
            canResize = false;
            document.body.style.cursor = null;
          }
        },
        resizePerformer = function(e){ // attached as a mouse listener to perform resizing of the panel
          var min = 220, max = window.innerWidth - 400, width = Math.max(Math.min(max, e.pageX), min);
          e.preventDefault();
          panel.width(width);
          log.css({left:width});
        },
        $span = $( '<span/>' ),
        safeText = function( string ) {
          return $span.text( string ).html();
        };

    panel.width(initialWidth); // set the initial width of the panel, can come from cookie
    log.css({left:initialWidth+'px'}); // resize the log to fit with the panel
    $(window).bind('resize', function(){ // listen to resizes to scale the panel/log correctly
      var min = 220, max = window.innerWidth - 400, width = Math.max(Math.min(max, panel.width()), min);
      panel.width(width);
      log.css({left:width});
      $.cookie('panelWidth', panel.width());
    }).trigger('resize');
    $(document).bind('mousemove', resizeDetector); // track the position of the mouse
    $(document).bind('mousedown', function(e){ // determine if user is activating panel resize
      if(!canResize) return;

      e.preventDefault();
      resizing = true;

      $(document)
        .unbind('mousemove', resizeDetector)
        .bind('mousemove', resizePerformer);
    });
    $(document).bind('mouseup', function(e){ // stop resizing action and save the panel width
      if(!resizing) return;
      resizing = false;
      $.cookie('panelWidth', panel.width());
      $(document)
        .unbind('mousemove', resizePerformer)
        .bind('mousemove', resizeDetector);
    });


    // expand/collapse response views
    $('ul#requests').click(function(e){
      var $target = $(e.target),
        $h2 = $target.is('h2') ? $target : $target.parents('h2');
        if (!$h2.is('h2')) return;
        $li = $h2.parents('li');
        $li[$li.hasClass('expanded') ? 'removeClass' : 'addClass']('expanded');
    });

    // add expand/collapse interations to the response nodes
    var initializeResponse = function(object){
      object.find('ul.object, ul.array').each(function(){
        var $this = $(this),
            $li = $this.parent(),
            $disclosure = $("<a>&#x25B8;</a>").addClass('disclosure').click(function(){
              $li[$li.hasClass('closed') ? 'removeClass' : 'addClass']('closed');
            });
        $li.addClass('closed').append($disclosure);
      });
      return object;
    }

    // outputs a single line of JSON
    var rawResponse = function(object, formatter){
      return JSON.stringify(object, null, formatter);
    };

    // build the response HTML nodes from the parsed JSON object
    var formatResponse = function(object, keyPath){
      var node, li;
      if (!keyPath) keyPath = [];
      if (!object || object.constructor == Array && object.length == 0) return;
      if ('object' === typeof(object)) {
        node = $("<ul></ul>").addClass('object');
        li;
        for(field in object){
          li = $("<li>");
          li.append($("<span></span>").addClass('key').text(field)).append(' ');
          if ( object && object[field] && ('array' === typeof(object[field]) || Array == object[field].constructor)) {
            li
              .append(
                $("<span></span>")
                  .text("Array["+object[field].length+"]")
                  .addClass('hint')
              );
          } else if('object' === typeof(object[field])) {
            li
              .append($("<span></span>")
                .text("Object")
                .addClass('hint')
              );
          }

          li.append(formatResponse(object[field], keyPath.concat([field])));
          node.append(li);
        }
      } else {
        if (object === undefined) return $("<span>undefined</span>");;
        var str = object.toString(), matches;
        node = $('<span>').addClass('value').addClass(typeof(object)).text(str)
        if (matches = str.match("^" + config.api_url + "(/.*)")) { // IF it's an API URL make it clickable
          node.click(function(){
            $('form').trigger('reset');
            $('[name=path]').val(matches[1]).parents('form').trigger('submit');
            log.animate({scrollTop:'0'}, 'fast');
          }).addClass('api-url');
        } else if(str.match(/^https?:\/\/[^.]+\.gravatar\.com\/avatar/)){ // If it's an Avatar let's add an img tag
          node = $('<img>').attr( 'src', str ).addClass('avatar').add(node);
        }
      }
      return node;
    }

    // the path build
    var $pathField = $("[name=path]"),
        $queryField = $("[name=query]"),
        $bodyField = $("[name=body]"),
        helpTimer = null,
        formatHelp = function(variable, help){
          var $node = $helpBubble.children().first();
          $node.html("");
          $node.append(
            $("<h1></h1>")
              .append($("<code></code>").text(variable))
              .append(" ")
              .append($("<em></em>").text(help.type))
          );
          switch(help.description.constructor){
            case String:
            $node.append($("<p></p>").text(help.description));
            break;
            case Object:
            var $dl = $('<dl>').appendTo($node);
            $.each(help.description, function(key, val){
              $dl.append("<dt>" + safeText( key ) + "</dt><dd>" + safeText( val ) + "</dd>")
            })
            break;
            default:
            $node.append("<p><em>Not available</em></p>")
            break;
          }
        },
        objectBuilder = function(){ // creates an interface to allow the user to enter values for each key in an object, also shows hints if available
          var $builder = $("<div>").addClass('object-builder'), values ={}, keys = [], help = {};
          $builder.setObject = function(object, helpValues){
            $builder.html('');
            keys = []
            help = helpValues;
            $.each(object, function(key, value){
              if(keys.indexOf(key) == -1) keys.push(key);
              values[key] = object[key] ? object[key] : values[key];
              $builder.append(
                $("<div>")
                  .addClass('object-property')
                  .append(
                    $('<div>').addClass('object-property-key').text(key).bind('click', function(e){
                      $(this).next().focus();
                    })
                  )
                  .append(
                    $('<div>').addClass('object-property-value').attr('contenteditable', true).text(values[key] || "").bind('keyup', function(){
                      values[key] = $(this).text();
                      $builder.trigger('valuechanged', [key, values[key]]);
                    }).bind('focus', function(){
                      // show the help
                      formatHelp(key, helpValues[key])
                      $helpBubble.show().css({
                        left:panel.width()+3,
                        top: $(this).parent().offset().top - $helpBubble.height()*0.5 + $(this).parent().height()*0.5
                      })

                    }).bind('blur', function(){
                      $helpBubble.hide();
                    })
                  )
                  .hover(
                    function(){
                      var $row = $(this);
                      helpTimer = setTimeout(function(){
                        formatHelp(key, helpValues[key])
                        $helpBubble.show().css({
                          left:panel.width() + 3,
                          top: $row.offset().top - $helpBubble.height()*0.5 + $row.height()*0.5
                        });
                      }, 1000);
                    },
                    function(){
                      clearTimeout(helpTimer);
                      $helpBubble.hide();
                    }
                  )
              )

            }); // each
          }
          var empty = function(item){
            return !item || item == "";
          }
          $builder.getObject = function(){
            var output = {};
            $.each(keys, function(index, key){
              if ( !empty(values[key]) ){
                output[key] = values[key];
              }
            });
            return output;
          }
          return $builder;
        },
        $pathBuilder = objectBuilder(),
        $queryBuilder = objectBuilder(),
        $bodyBuilder = objectBuilder();

    // $path, $query, $body
    $pathField.parents('div').first().append($pathBuilder);
    $queryField.parents('div').first().append($queryBuilder);
    $bodyField.parents('div').first().append($bodyBuilder);

    // the help bubble used by the object_builder to display contextual help information
    var $helpBubble = $('<div id="help-bubble"><div></div></div>');
    $helpBubble.appendTo(document.body).hide();
    inputs.bind('scroll', function(){
      $helpBubble.hide();
    });

    // load up the help docs from the API and build a clickable list of API endpoints
    var $reference = $('#reference'), $list = $reference.find('ul'), $fields = $('.inputs > div').not('#reference');
    $reference.append($("<div><div></div></div>").addClass('throbber'));

   $.ajax( { url: config.api_url + "/" } ).done( function( response ) {

      $reference.find('.throbber').remove();
      $.each(response.routes, function(index){
        var help = response.routes[index];
        var helpGroup = safeText( help.group ),
	    group = $list.find('.group-'+helpGroup);
        if (!group.is('li')) group = $('<li><strong>'+helpGroup+'</strong><ul></ul></li>').addClass('group-'+helpGroup).appendTo($list);
        console.log(help);
        help.supports = help.supports || [];
        $.each(help.supports, function (method_index, method) {
          if (method === 'HEAD') {
            return;
          }

          group.find('ul').append(
            $('<li>')
              .append($('<span class="path-details"></span>').text(method + " " + index))
              // .append($('<span class="description"></span>').text(help.description))
              .click(function(e){
                var $target = $(e.target),
                    $li = $target.is('li') ? $target : $target.parents('li').first()

                if($li.hasClass('selected')) return;
                $reference.find('li.selected').removeClass('selected');
                $li.addClass('selected');

                $.each({'path':$pathBuilder, 'query':$queryBuilder, 'body':$bodyBuilder}, function(prop, builder){
                  var o = {};
                  // $.each(help.request[prop], function(key, settings){
                    // o[key] = ""
                  // });
                  // builder.setObject(o, help.request[prop]);
                });
                $pathField.val(index).trigger('keyup');
                $fields.find('.raw-toggle').removeClass('on').show().trigger('toggle', [false]);
                $fields.first().hide().find('select').val(method);
                $fields.last()[method == 'POST' ? 'show' : 'hide']();
              })
          )
        });
      });
    })


    // create a toggle so the object_builder can be replaced with a raw input field
    $fields.has('input, textarea').each(function(){
      var $field = $(this),
          $toggle = $('<span class="raw-toggle">Raw</span>')
                        .click(function(){ $(this).toggleClass('on').trigger('toggle', [$(this).hasClass('on')]) })
      $field.append($toggle);
      $toggle
        .bind('toggle', function(e, on){
          $field.find('input, textarea')[on ? 'show' : 'hide']();
          $field.find('.object-builder')[on ? 'hide' : 'show']();
        })
        .hide()
        .addClass('on')
        .trigger('toggle', [true])
    });

    // clear the form
    $('form').bind('reset', function(){
      $fields.show();
      $fields.find('.raw-toggle').hide().addClass('on').trigger('toggle', [true]);
      $reference.find('.selected').removeClass('selected');
    })

    // replace a string with placeholders with the given values
    var interpolate = function(string, values){
      var string = string.slice();
      $.each(values, function(key, value){
        string = string.replace(key, value)
      })
      return string;
    }

    // User has submitted the form, build the request and send it
    $('form[action="#request"]').submit(function(e){
      e.preventDefault();
      // let's build a request;

       var req = {
                    path: $(this.path).parent().siblings().is('.raw-toggle.on') ? this.path.value : interpolate(this.path.value, $pathBuilder.getObject()),
                    method:this.method.value,
                    data:$(this.body).parent().siblings().is('.raw-toggle.on') ? this.body.value : $bodyBuilder.getObject(),

                    beforeSend: auth.ajaxBeforeSend
                  }; 

          req.query = query = $(this.query).parent().siblings().is('.raw-toggle.on') ? this.query.value : $queryBuilder.getObject();
          console.log(query);
          req.url = config.api_url + req.path + '?' + $.param( query );

          request = $('<li></li>').prependTo(log).addClass('loading'),
          title = $("<h2><small>"+safeText( req.method )+"</small> "+safeText( req.path )+"</h2>").appendTo(request);
          var q;
          if (typeof(req.query) == 'object') {
            q = $.param(req.query);
          } else {
            q = req.query
          }
          if(typeof(q) == 'string' && q.trim() != "") {
            title.append($('<em>').text((q[0] == "?" ? "" : "?") + q))
          }
          throbber = $('<div><div></div></div>').addClass('throbber').appendTo(request),
          timer = (new Date).getTime();

        console.log('test');
          console.log(req);

          $.ajax( req ).done( function(response, statusCode){
            var responseTime = (new Date).getTime() - timer;

            request
              .append(
                $('<span class="response-meta"></span>')
                  .append($('<span class="response-time"></span>').text(responseTime + " ms "))
                  .append($('<span class="status-code"></span>').text(statusCode || "?").attr('data-status-code', statusCode || '4xx'))
              )
            setTimeout(function(){
              request.addClass('done').removeClass("loading");
            }, 10);

            var formats = $('<div>')
                              .addClass('structured')
                              .append(
                                response ?
                                  initializeResponse(formatResponse(response)) :
                                  $('<span class="empty-response">empty response</span>')
                              );

            formats = formats.add($('<pre>')
                          .addClass('pretty')
                          .text(rawResponse(response, "\t"))
                        );
            formats = formats.add($('<pre>')
                          .addClass('raw')
                          .text(rawResponse(response))
                        );

            $("<div>")
              .addClass("response")
              .append(formats.hide())
              .appendTo(request);

            $('<ul>')
              .addClass('tabs')
              .append("<li>Structured</li><li>Pretty</li><li>Raw</li>").click(function(e){
                var $this = $(this), $children = $this.children(), $li = $children.filter(e.target);
                $children.not($li).removeClass('selected');
                $li.addClass('selected');
                formats.hide().eq($children.index($li)).show();
              })
              .appendTo(request)
              .children().first().trigger('click');

            request.addClass('expanded');
		/*	$.post( '<?php echo admin_url( 'admin-ajax.php' ); ?>', { action: 'console_request_performed', path: req.path, nonce: '<?php echo wp_create_nonce( 'console_request_km_nonce' ); ?>' } ); */
          });

    });

});

  var QueryStringToHash = function QueryStringToHash  (query) {
            var query_string = {};
            var vars = query.split("&");
            for (var i=0;i<vars.length;i++) {
              var pair = vars[i].split("=");
              pair[0] = decodeURIComponent(pair[0]);
              pair[1] = decodeURIComponent(pair[1]);
                  // If first entry with this name
              if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = pair[1];
                  // If second entry with this name
              } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]], pair[1] ];
                query_string[pair[0]] = arr;
                  // If third or later entry with this name
              } else {
                query_string[pair[0]].push(pair[1]);
              }
            } 
            return query_string;
          };
   

 });