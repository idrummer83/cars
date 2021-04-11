function Site($global_context){
    
    var _this = this;
    this.$global_context = $global_context;
    this.integrated_landing = false;
    var $set_height = $('.set_height', $global_context),
        $videos = $("iframe[src^='http://player.vimeo.com'], iframe[src^='http://www.youtube.com'], object, embed", $global_context),
        $comments_slider = $('#comments_slider', $global_context),
        $comments_left = $('#comments_left', $global_context),
        $comments_right = $('#comments_right', $global_context),
        $comments_header = $('#comments_header', $global_context),
        $comments_headers = $('.comment_header', $comments_header),
        $comments_header_slider = $('#comments_header_slider', $comments_header_slider),
        $comments_body = $('#comments_body', $global_context),
        $comments_inner = $('#comments_inner', $global_context),
        $comment3_nav = $('#comment3_nav', $global_context),
        $comments = $('.comment', $comments_slider),
        $left_menu = $('#left_menu', $global_context),
        $left_menu_lis = $left_menu.find('li:not(.home)'),
        $left_menu_a = $left_menu_lis.find('a'),
        section_titles = $('.section_title', $global_context),
        comments_move = false,
        process_move = false,
        easeMode = 'easeInOutExpo',
        $html_body = $('html, body'),
        $sections = $('.content', $global_context),
        $timer_days = $('.timer_days', $global_context),
        $timer_hours = $('.timer_hours', $global_context),
        $timer_minutes = $('.timer_minutes', $global_context),
        $header = $('#header', $global_context),
        $root_menu_a = $('#root_menu a', $global_context),
        $fullscreen_sections = $('.fullscreen_section', $global_context),
        $resized_images = $('.resized_image', $global_context),
        $frame_2_inner = $('.frame_2_inner', $global_context),
        index_slider_move = false,
        index_slider_interval_id,
        index_slider_tiemout_delay = 5000,
        sections_top = [],
        scroll_is_animated = false,
        window_loaded = false,
        iscroll = [],
        reader_on = false,
        af_size = 100,
        scrolltop_before_reader,
        forms_timeout = [],
        sform_message_timeout,
        form_message_timeout;
        
    this.easeMode = easeMode;
    this.preloaded_images = [];
    
    this.preload_callback = function(image_links, callback) {
        var count = image_links.length;
        $.each(image_links, function(){ 
            if(typeof _this.preloaded_images[this] == 'undefined'){
                _this.preloaded_images[this] = 1;
                $('<img/>').attr('src', this).load(function(){
                    if( --count == 0 ){
                        callback.apply();
                    }
                });
            }else{
                if( --count == 0 ){
                    callback.apply();
                }
            }
        });      
    };
    
    var loader_ready, current_angle = 0, angle_step = 10, loader_interval_id, canvas_loading, hide_loader = true, img_l;
    
    this.show_loading = function(show){
        if(loader_ready){
            clearInterval(loader_interval_id);
            if(show){
                if(($.browser.msie && $.browser.version > 8) || !$.browser.msie){
                    loader_interval_id = setInterval(function(){
                        draw();
                    }, 50);
                }
                canvas_loading.style.zIndex = 999999;
            }else{
                canvas_loading.style.zIndex = -1;
            }
        }else if(!show){
            hide_loader = true;
        }
    };
    
    function draw(){
        var canvas = canvas_loading.getContext('2d');
        canvas.clearRect(0, 0, 110, 110);
        canvas.save();
        canvas.translate(55, 55);
        current_angle = current_angle == 360 ? 1 : current_angle + angle_step;
        canvas.rotate( current_angle * Math.PI / 180 );
        canvas.drawImage(img_l, -55, -55);
        canvas.restore();
    };
    
    function set_height(){
        if(window_loaded || _this.integrated_landing){
            $set_height.each(function(){
                var $this = $(this),
                    heihgt_el = $($($this).attr('data-height_el'), $set_height),
                    height = heihgt_el.height();
                $this.height(height);
            });
        }
    }
    
    function push_to_ga(link){
        if(typeof(ga) == 'function'){
            ga('send', 'pageview', {page: l_prefix+link, title: document.title});
        }else if(typeof(_gaq) != 'undefined'){
            _gaq.push(['_trackPageview', l_prefix+link]);
        }
    }
    
    function resize_video(){
        $videos.each(function() {
            var $this = $(this),
                ratio = $this.attr('data-ratio'),
                inner = $this.parents(".video_inner"),
                inner_width = inner.width();
            if(!ratio){
                var this_height = $this.attr('height'),
                    this_width = $this.attr('width');
                ratio = this_height / this_width;
                $this.attr('data-ratio', ratio).removeAttr('height').removeAttr('width');
            }
            $this.css({
                width: inner_width,
                height: inner_width * ratio
            });
            $this.siblings('.video_shadow').css({
                width: inner_width
            });
        });
        
    }
    
    function recount_members(section){
        var index = 1;
        $('.add_persons', section).find('.person_table').each(function(){
            var $this = $(this);
            set_new_person_index($this, index);
            $this.find('.person_title>div>span').text(index+1);
            index ++;
        });
    }
    
    function set_new_person_index(table, index){
        table.find('input').each(function(){
            var $this = $(this),
                name = $this.attr('name');
            $this.attr('name', name.replace(/\[[0-9]*\]/, '['+index+']'));
        });
    }
    
    function resize_comments(){
        var body_width = $comments_body.width(),
            active_comment = $comments.filter('.active'),
            height = active_comment.outerHeight();
        $comments.width(body_width);
        $comments_slider.css({
            width: $comments.length * body_width,
            marginLeft: -body_width * parseInt(active_comment.data('index'))
        });
        if(typeof(comments_form) != 'undefined'){
            $comments_slider.height(height);
        }else{
            $comments_inner.height(height);
        }
    }
    
    function check_comments_nav(){
        var active = $comments.filter('.active'),
            next = active.next(),
            prev = active.prev();
            
        $comments_left.add($comments_right).removeClass('disabled');
            
        if(!next.length){
            $comments_right.addClass('disabled');
        }
        if(!prev.length){
            $comments_left.addClass('disabled');
        }
    }
    
    function move_comments($this, delta){
        if(!$this.hasClass('disabled') && !comments_move){
            var width = $comments_body.width(),
                active = $comments.filter('.active'),
                active_index = parseInt(active.data('index'));
            
            if(delta == 0){
                $comment3_nav.find('li.active').removeClass('active');
                $this.addClass('active');
                var next_index = parseInt($this.data('index')),
                    next = $comments.filter('[data-index='+next_index+']');
            }else{
                var next = delta > 0 ? active.next() : active.prev(),
                    next_index = parseInt(next.data('index'));
            }
            
            active.removeClass('active');
            next.addClass('active');
            
            check_comments_nav();
            
            comments_move = true;
            
            var $anim_height_el = $comments_inner;
            if(delta == 0){
                $comments_headers.filter('.active').animate({
                    opacity: 0
                }, 300, function(){
                    $(this).removeClass('active').removeAttr('style');
                });
                $comments_slider.animate({
                    height: next.height(),
                    marginLeft: -width * next_index
                }, {
                    duration: 400,
                    easing: easeMode,
                    step: function(){
                        resize_image($comments_inner.parents('.c_comnents').find('.resized_image'), true);
                    },
                    complete: function(){
                        $comments_headers.filter('[data-index='+next_index+']').css({
                            opacity: 0,
                            marginTop: $comments_header.height()
                        }).addClass('active').animate({
                            marginTop: 0,
                            opacity: 1
                        }, 300);
                        comments_move = false;
                    }
                });
            }else{
                $comments_inner.animate({
                    height: next.height()
                }, {
                    duration: 400,
                    easing: easeMode,
                    step: function(){
                        resize_image($comments_inner.parents('.c_comnents').find('.resized_image'), true);
                    }
                });
                $comments_slider.animate({
                    marginLeft: -width * next_index
                }, 400, easeMode, function(){
                    comments_move = false;
                });
            }
        }
    }
    
    function resize_process(){
        var width = _this.min_spacing_w,
            process = $('.process');
        $('.process_showcase').css({
            marginLeft: -process.filter('.active').data('index') * width,
            width: width * process.length
        });
        process.width(width);
    }
    
    function check_process_nav(){
        var active = $('.process.active', $global_context),
            li_nav = $('.process_nav', $global_context).children('li'),
            next = active.next(),
            prev = active.prev();
            
        li_nav.removeClass('active');
        li_nav.filter('[data-index="'+active.attr('data-index')+'"]').addClass('active');
            
        $('.process_arrow', $global_context).removeClass('disabled');
            
        if(!next.length){
            $('.process_right', $global_context).addClass('disabled');
        }
        if(!prev.length){
            $('.process_left', $global_context).addClass('disabled');
        }
    }
    
    function move_process($this, delta, move_to_index){
        if(!$this.hasClass('disabled') && !process_move){
            var width = $('.process').width(),
                active = $('.process.active'),
                next = delta > 0 ? active.next() : active.prev(),
                next_index = parseInt(next.data('index'));
            
            active.removeClass('active');
            if(typeof move_to_index != 'undefined'){
                $('.process[data-index='+move_to_index+']', $global_context).addClass('active');
            }else{
                next.addClass('active');
            }
            
            check_process_nav();
            
            process_move = true;
            $('.process_showcase', $global_context).animate({
                marginLeft: -width * (typeof move_to_index != 'undefined' ? move_to_index : next_index)
            }, 800, easeMode, function(){
                process_move = false;
            });
        }
    }
    
    this.get_scrolltop = function(){
        if(_this.integrated_landing){
            return $global_context.scrollTop();
        }else{
            if(typeof pageYOffset!= 'undefined'){
                //most browsers
                return pageYOffset;
            }
            else{
                var B = document.body; //IE 'quirks'
                var D = document.documentElement; //IE with doctype
                D= (D.clientHeight)? D: B;
                return D.scrollTop;
            }
        }
    };
    
    this.set_scrolltop = function(pos, animate_duration, callback){
        if(scroll_is_animated) return false;
        pos = pos >= _this.header_height ? pos - _this.header_height : pos;
        if(parseInt(animate_duration)){
            scroll_is_animated = true;
            $html_body.animate({scrollTop: pos, avoidTransforms: true}, animate_duration, easeMode);
            setTimeout(function(){
                scroll_is_animated = false;
                if(typeof callback != 'undefined'){
                    callback();
                }
                fix_ipad_fixed_els();
            }, animate_duration);
        }else{
            $html_body.scrollTop(pos);
            if(typeof callback != 'undefined'){
                callback();
            }
            fix_ipad_fixed_els();
        }
    };
    
    function get_section_top(section){
        for(var key in sections_top){
            var el = sections_top[key];
            if(el.el == section){
                return el.top;
            }
        }
        return 0;
    }
    
    function move_to_content_section(section, speed, callback){
        _this.recount_sections();
        var duration = speed ? speed : 0;
        if(section){
            var $section = $('.content[data-section="'+section+'"]', $global_context);
            if($section.length){
//                var offset_top = $section.offset().top - 
//                                 (fixed_menu ? $header.outerHeight() : 0) - 
//                                 (_this.integrated_landing ? $global_context.offset().top : 0)
//                         ;
                var offset_top = get_section_top(section);
                _this.set_scrolltop(offset_top, duration, callback);
            }else{
                if(typeof callback == 'function'){
                    callback();
                }
            }
        }else{
            _this.set_scrolltop(0, duration, callback);
        }
    }
    
    this.recount_sections = function(){
        var all_height = $('#header', $global_context).outerHeight();
        
        $sections.each(function(){
            var $this = $(this),
                section = $this.data('section');
            
            sections_top.push({
                el: section,
                top: all_height - 
                     (fixed_menu ? $header.outerHeight() : 0)
                     - 1
            });
            
            all_height += $this.outerHeight();
        });
        
        sections_top.reverse();
    }
    
    function add_zero(num){
        if(num < 10){
            return '0'+num;
        }else{
            return num;
        }
    }
    
    function recount_timer(){
        if(timer_values == 1){
            timer_seconds -= 1;
        }else{
            timer_seconds -= 60;
        }
        if(timer_seconds > 0){
            var s = timer_seconds;
            if(timer_values == 1){ // часы, минуты, секунды
                var days = Math.floor(s / 3600); // hours
                s %= 3600;
                var hours = Math.floor(s / 60); // minutes
                s %= 60;
                var minutes = s; // seconds
            }else{ // дни, часы, минуты
                var days = Math.floor(s / 86400);
                s %= 86400;
                var hours = Math.floor(s / 3600);
                s %= 3600;
                var minutes = Math.floor(s / 60);
                s %= 60;
            }
            $timer_days.text(add_zero(days));
            $timer_hours.text(add_zero(hours));
            $timer_minutes.text(add_zero(minutes));
        }
    }
    
    function resize_image(el, props_auto){
        if(el.length){
            el.each(function(){
                var $this = $(this),
                    bg_img = $this.children('img'),
                    ri_content = bg_img.siblings('.resized_image_content');

                if(!bg_img.length){
                    return false;
                }

                if(!bg_img.length){
                    return false;
                }

    //            var w = '', h = '', parent_fullscreen = $this.parents('.fullscreen_width');
    //
    //            if(parent_fullscreen.length){
    //                w = _this.win_w;
    //            }

                $this.css({
                    width: '',
                    height: ''
                });

                if(props_auto){
                    var picWidth = bg_img.data('width'),
                        picHeight = bg_img.data('height');
                }else{
                    var picWidth = 1920,
                        picHeight = 1080;
                }

                var image_w = $this.width(),
                    image_h = $this.height();

                var navRatio = image_w / image_h;

                var picRatio = picWidth / picHeight,
                    newHeight,
                    newWidth;
                if (navRatio > picRatio) {
                    newHeight = (image_w / picWidth) * picHeight;
                    newWidth = image_w;
                } else {
                    newHeight = image_h;
                    newWidth = (image_h / picHeight) * picWidth;
                }
                var newTop = parseInt(0 - ((newHeight - image_h) / 2)),
                    newLeft = parseInt(0 - ((newWidth - image_w) / 2));
                $this.css({'height': image_h, 'width': image_w});
                bg_img.add(ri_content).css({'margin-top': newTop, 'margin-left': newLeft, 'width': image_w+((newLeft*2)*-1), 'height': image_h+((newTop*2)*-1)});
            });
        }
    }
    
    this.reload_scrolls = function(){
        if($.browser.msie && $.browser.version <= 8){
            return false;
        }
        for (var key in iscroll) {
            if(key != 'in_array'){
                if(typeof iscroll[key] == 'object'){
                    if(iscroll[key]){
                        iscroll[key].refresh();
                    }
                }
            }
        }
    };
    
    this.init_scroll = function(el, scroll_id, h_scroll, scroll_el){
        if($.browser.msie && $.browser.version <= 8){
            return false;
        }
        if(!scroll_el){
            scroll_el = document.getElementById('body');
        }
        if(typeof iscroll[scroll_id] == 'undefined'){
            iscroll[scroll_id] = new iScroll(el[0], {
                scrollEl: scroll_el,
                hScroll: !!h_scroll, 
                checkDOMChanges: true, 
                useTransition: false,
                onBeforeScrollStart: function (e) {
                    var target = e.target;
                    while (target.nodeType != 1) target = target.parentNode;

                    if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA'){
                        e.preventDefault();
                    }
                }
            });

        }
    };
    
    function set_article_fullscreen_font_size(){
        if(af_size <= 200 && af_size >= 80){
            var first_els = $('#article_full_content', $global_context).children('*');
            first_els.css('font-size', af_size+'%');
            first_els.find('*').css('font-size', 'inherit');
        }
        af_size = af_size > 200 ? 200 : af_size;
        af_size = af_size < 80 ? 80 : af_size;
    }
    
    function reader_left_right(section, el){
        if(el.length){
            var $reader_contents = $('.reader_content', $('#'+section)), 
                $prev = {}, 
                $next = {};
            $reader_contents.each(function(k, v){
                var $this = $(this),
                    active = el.data('id') == $this.data('id');
                if(active){
                    $prev = $($reader_contents[k-1]);
                    $next = $($reader_contents[k+1]);
                }
            });
            var $article_left = $('#article_left'),
                $article_right = $('#article_right');
            // prev
            if($prev.length){
                $article_left.removeClass('disabled_anav')
                             .find('.atext>div').html($prev.data('title')).end()
                             .attr('data-id', $prev.data('id'));
                $article_left.find('.aimage').html('<img src="'+$prev.data('img_m')+'" alt=" ">');
            }else{
                $article_left.addClass('disabled_anav');
            }
            // next
            if($next.length){
                $article_right.removeClass('disabled_anav')
                              .find('.atext>div').html($next.data('title')).end()
                              .attr('data-id', $next.data('id'));
                $article_right.find('.aimage').html('<img src="'+$next.data('img_m')+'" alt=" ">');
            }else{
                $article_right.addClass('disabled_anav');
            }
        }
    }
    
    function show_reader(section, el, content, title, image, add_class, no_scroll){
        reader_left_right(section, el);
        reader_on = true;
        scrolltop_before_reader = _this.get_scrolltop();
        $global_context.addClass('reader_view'+(add_class ? ' '+add_class : ''));
        $('#main', $global_context).hide();
        $('#reader', $global_context).attr('data-section', section).show();
        $('#article_full_content', $global_context).html(content);
        if(add_class){
            $('#close_reader', $global_context).attr('data-adv_classes', add_class);
        }
        if(title){
            $('#article_full_title', $global_context).html(title);
        }
        if(image){
            $('#article_full_image', $global_context).html('<img src="'+image+'" alt="'+title+'">');
        }
        
        af_size = 120;
        set_article_fullscreen_font_size();
        
        if(no_scroll){
            if(typeof iscroll[1] != 'undefined'){
                iscroll[1].destroy();
                iscroll[1] = undefined;
            }
        }else{
            _this.init_scroll($('#article_content_inner', $global_context), 1, false);
        }
        
//        reader_nav(el);
    }
    
    function close_reader(add_class){
        reader_on = false;
        $global_context.removeClass('reader_view'+(add_class ? ' '+add_class : ''));
        $('#main', $global_context).show();
        var section = $('#reader').attr('data-section');
        $('#reader', $global_context).hide();
        $('#reader', $global_context).attr('data-section', '');
        $('#article_full_content, #article_full_title', $global_context).html('');
        $('#close_reader', $global_context).removeAttr('data-adv_classes');
        $(window).resize();
        _this.set_scrolltop(scrolltop_before_reader, 0);
//        move_to_content_section(section, 0);
    }
    
    function get_section_min_top(section){
        var min_scroll_top = 9999999;
        for(var key in sections_top){
            var el = sections_top[key];
            if(el.top < min_scroll_top && el.top > 0){
                min_scroll_top = el.top;
            }
        }
        return min_scroll_top;
    }
    
    this.scroll_event = function(){
        var prev_scroll_top = _this.scroll_top,
            scroll_top = _this.get_scrolltop(),
            min_scroll_top = get_section_min_top();
        _this.scroll_top = scroll_top;
        for(var key in sections_top){
            var el = sections_top[key];
            if(scroll_top < min_scroll_top){
                $left_menu_a.add($root_menu_a).removeClass('active');
                break;
            }
            if(el.top <= scroll_top ){
                var menu = $root_menu_a.filter('[data-section="'+el.el+'"]'),
                    left_menu = $left_menu_a.filter('[data-section="'+el.el+'"]');
                if(left_menu.length && !left_menu.hasClass('active')){
                    $left_menu_a.removeClass('active');
                    $left_menu_a.filter('[data-section="'+el.el+'"]').addClass('active');
                }
                if(fixed_menu && menu.length && !menu.hasClass('active')){
                    $root_menu_a.removeClass('active');
                    $root_menu_a.filter('[data-section="'+el.el+'"]').addClass('active');
                    push_to_ga('section_'+el.el);
                }
                break;
            }
        }
        var scroll_event_trigger = prev_scroll_top < scroll_top ? "onScrollDown" : "onScrollTop";
        $global_context.trigger(scroll_event_trigger);
    };
    
    var help_div_h = 0;
    function fix_ipad_fixed_els(){
        if($.support.touch){
            var $help_div = $('#ipad_fix_scroll');
            if(!help_div_h){
                help_div_h = 1;
            }else{
                help_div_h = 0;
            }
            $help_div.animate({
                height: help_div_h
            }, 5);
        }
    }
    
    this.init_gmap = function(element_id, gmap_lat, gmap_lng, flag, zoom){
        var myLatlng = new google.maps.LatLng(gmap_lat, gmap_lng);
        var myOptions = {
          zoom: zoom,
          center: myLatlng,
          mapTypeControl:false,
          scrollwheel: false,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.RIGHT_TOP
          },
          panControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
          }
        };

        var map = new google.maps.Map(document.getElementById(element_id), myOptions);
//        var image = l_prefix+'images/flag.png';

        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            title: '',
            icon: flag
        });
    };
    
    function index_slider_set_navs($slider){
        var current_pos = parseInt($slider.attr('data-pos')),
            $index_slider_slides = $('.slide', $slider),
            right_disabled = (current_pos + 1 + 1) > $index_slider_slides.length,
            left_disabled = !current_pos,
            $index_slider_nav = $('.slider_nav', $slider),
            $slider_navs = $('.slides_nav_dots li', $slider);

        $slider_navs.removeClass('active');
        $slider_navs.filter('[data-index='+current_pos+']').addClass('active');

        $index_slider_nav.removeClass('cat_nav_disabled');
        if(right_disabled){
            $index_slider_nav.filter('.cat_right').addClass('cat_nav_disabled');
        }
        if(left_disabled){
            $index_slider_nav.filter('.cat_left').addClass('cat_nav_disabled');
        }
    }

    function index_slider_move_items($slider, delta, goto_index, index){
        if(!index_slider_move){
            index_slider_move = true;
            if(goto_index){
                new_pos = index;
            }else{
                var delta_move = delta,
                    current_pos = parseInt($slider.attr('data-pos')),
                    new_pos = current_pos + delta_move;
            }

            $slider.attr('data-pos', new_pos);

            var $index_slider_slides = $('.slide', $slider),
                current = $index_slider_slides.filter(':visible'),
                new_el = $index_slider_slides.filter(':eq('+new_pos+')');
            current.css({
                display: 'block'
            }).removeClass('final_active active').addClass('pre_active');
            new_el.addClass('active').show().css({
                opacity: 0
            });
            $(window).resize();
            new_el.animate({
                opacity: 1
            }, 1500, function(){
                current.hide().removeClass('pre_active');
                new_el.addClass('final_active');
                index_slider_move = false;
            });

            index_slider_set_navs($slider);
        }
    }
    
    function createCookie(name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        }
        else
            var expires = "";
        document.cookie = name + "=" + value + expires + "; path="+l_prefix;
    }

    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ')
                c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0)
                return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function eraseCookie(name) {
        createCookie(name, "", -1);
    }
    
    (function(){

        $.extend($.support, {
            touch: "ontouchend" in document
//            touch: true
        });
        
        if($.support.touch){
            $global_context.addClass('touch');
        }
        
        if($global_context[0].nodeName == 'DIV'){
            $html_body = $global_context;
            _this.integrated_landing = true;
        }
        
        // init loader
        if(($.browser.msie && $.browser.version > 8) || !$.browser.msie){
            canvas_loading = document.getElementById('loading');
            img_l = new Image();
            img_l.onload = function(){
                loader_ready = true;
                if(!hide_loader){
                    _this._this.show_loading(true);
                }else{
                    hide_loader = false;
                }
            };
            // img_l.src = l_prefix + 'images/loader.png';
            img_l.src = 'images/loader.png';
        }
        
        if(typeof(timer_values) !== 'undefined'){
            if(timer_values == 1){
                setInterval(recount_timer, 1000);
            }else{
                setInterval(recount_timer, 60000);
            }
        }
        
        $('.show_all_clients', $global_context).click(function(){
            var $this = $(this);
            $('.all_clients', $global_context).removeClass('all_clients');
            $this.remove();
            resize_image($resized_images, true);
        });
        
        if(typeof(comments_form) == 'undefined'){

            $comments_left.click(function(){
                move_comments($(this), -1);
            });

            $comments_right.click(function(){
                move_comments($(this), 1);
            });
        }else{
            $comment3_nav.find('li').click(function(){
                var $this = $(this);
                if(!$this.hasClass('active')){
                    move_comments($this, 0);
                }
            });
        }

        $('.process_left', $global_context).click(function(){
            move_process($(this), -1);
        });

        $('.process_right', $global_context).click(function(){
            move_process($(this), 1);
        });

        $('.process_nav', $global_context).find('li').click(function(){
            
            var $this = $(this),
                active = $this.siblings('.active'),
                active_index = active.data('index'),
                index = $this.data('index'),
                delta = active_index < index ? 1 : -1;
            move_process($(this), delta, index);
        });

        check_process_nav();
        if(typeof(comments_form) == 'undefined'){
            check_comments_nav();
        }

        // страница вопрос-ответ - раскрываем ответ
        $('.question', $global_context).live('click', function(){
            var $this = $(this),
                pqm = $this.children('.pqm'),
                answer = $this.next('div.answer');
            if(answer.is(':visible')){
                pqm.removeClass('qminus').addClass('qplus');
                answer.stop(true, true).slideUp(200);
            }else{
                pqm.removeClass('qplus').addClass('qminus');
                answer.stop(true, true).slideDown(200);
            }
        });

        $('#main_btn', $global_context).click(function(){
            move_to_content_section($(this).attr('data-scroll_to'), 1500);
        });

        $root_menu_a.click(function(){
            move_to_content_section($(this).data('section'), 1000);
            return false;
        });

//        var resize_timeout;

        $left_menu.find('span').click(function(){
            _this.recount_sections();
            _this.set_scrolltop(0, 1000);
        });
        if(!$.support.touch){
            $left_menu_a.mouseenter(function(){
                var $this = $(this).parent(),
                    $hint = $this.find('.hint');
                $hint.stop(true, true).fadeIn(400);
            }).mouseleave(function(){
                var $this = $(this).parent(),
                    $hint = $this.find('.hint');
                $hint.stop(true, true).fadeOut(400);
            });
        }
        $left_menu_a.click(function(){
            move_to_content_section($(this).data('section'), 1000);
            return false;
        });

        var $works = $('.c_work');

        $(window).resize(function(){
//            clearTimeout(resize_timeout);
//            resize_timeout = setTimeout(function(){
                if(fixed_menu){
                    $('#content_main', $global_context).css({
                        paddingTop: $header.outerHeight()
                    });
                }
                this.menu_h = fixed_menu ? $header.outerHeight() : 0;
                var section_full_height = (_this.integrated_landing ? $global_context.height() : $(this).height()) - 
                                          (fixed_menu ? $header.outerHeight() : 0);

                _this.win_w = $('#content_main', $global_context).width();
                _this.win_h = section_full_height;
                
                $frame_2_inner.css({
                    height: section_full_height,
                    width: _this.win_w
                });

                $fullscreen_sections.css({
                    height: section_full_height
                });

                _this.min_spacing_w = $('.min_spacing:visible').width();

                if($left_menu.length){
                    $left_menu.css({
                        marginTop: -($left_menu.height() - (fixed_menu ? $header.outerHeight() : 0)) / 2
                    });
                }

                if($works.length){
                    $works.each(function(){
                        var $this = $(this),
                            dev_width = $('.devider', $this).outerWidth(true);
                        $('.how_we_work', $this).css({
                            marginLeft: dev_width
                        });
                    });
                }

                resize_image($resized_images, true);
                set_height();
                resize_video();
                resize_comments();
                setTimeout(function(){
                    resize_comments();
//                    _this.recount_sections();
                }, 10);
                resize_process();
//                if(fixed_menu){
//                    _this.recount_sections();
//                }
//            }, 150);
        }).resize();

        if(_this.integrated_landing){
            setTimeout(function(){
                $(window).resize();
            }, 50);
        }

        if(_this.integrated_landing){
            $global_context.scroll(_this.scroll_event);
        }else{
            var timeout_recount = 0;
            $(window).scroll(function(){
                clearTimeout(timeout_recount)
                timeout_recount = setTimeout(_this.recount_sections, 50);
                _this.scroll_event();
            });
        }
        _this.recount_sections();

        window.onload = function(){
            window_loaded = true;
            
            $(window).resize();
            setTimeout(fix_ipad_fixed_els, 100);
            
            var hash = location.hash.replace('#', '');
            if(hash){
                if(hash != 'main'){
                    move_to_content_section(hash, 1000);
                }
            }
            
            _this.recount_sections();
            _this.scroll_event();
        }
        
        
        // reader
        
        $('.article_nav').mouseenter(function(){
            if(!$.support.touch){
                var $this = $(this),
                    id = $this.attr('id'),
                    show = id == 'article_right' ? {left: 0} : {right: 0};
                $this.find('.aimage').stop(true).animate(show, 300);
                $this.stop(true).animate({width: 190}, 300, function(){
                    $this.find('.atext').stop(true).slideDown(200);
                });
            }
        }).mouseleave(function(){
            if(!$.support.touch){
                var $this = $(this),
                    id = $this.attr('id'),
                    hide = id == 'article_right' ? {left: '100%'} : {right: '100%'};
                $this.find('.atext').stop(true, true).slideUp(200, function(){
                    $this.find('.aimage').stop(true).animate(hide, 300);
                    $this.stop(true).animate({width: 50}, 300);
                });
            }
        }).click(function(){
            var id = $(this).attr('data-id'),
                $content = $('.reader_content[data-id='+id+']'),
                title = $content.data('title'),
                image = $content.data('img'),
                section = $content.parents('.content').attr('id');
            show_reader(section, $content, $content.html(), title, image);
        });
        
        $('#article_zoom_plus', $global_context).bind('click', function(){
            af_size += 10;
            set_article_fullscreen_font_size();
        });

        $('#close_reader', $global_context).click(function(){
            close_reader($(this).attr('data-adv_classes'));
        });

        $('#article_zoom_minus', $global_context).bind('click', function(){
            af_size -= 10;
            set_article_fullscreen_font_size();
        });
        
        $('.show_reader', $global_context).live('click', function(){
            var $this = $(this),
                content = $this.parent().siblings('.reader_content'),
                title = content.data('title'),
                image = content.data('img'),
                link = $this.attr('data-link'),
                section = $this.parents('.content').attr('id');
            if($this.attr('data-blank') && link){
                window.open(link);
                return false;
            }else{
                if($this.hasClass('reader_full')){
                    content = '<div class="site_preview"><iframe src="'+link+'"></iframe></div>';
                    show_reader(section, {}, content, '', '', 'fullscreen_reader reader_nozoom', true);
                }else{
                    show_reader(section, content, content.html(), title, image);
                }
            }
        });
        
        
        $('.data_form input, .data_form textarea', $global_context).live('keyup', function(){
            var $this = $(this),
                form = $this.parents('.data_form'),
                id = form.data('id');
            createCookie('form_data['+id+']', encodeURIComponent(form.serialize()));
        });
        $('.data_form', $global_context).live('submit', function(){
            var form = $(this),
                id = form.data('id'),
                message = form.find('.data_form_message'),
                submit = form.find(':submit'),
                loader = submit.siblings('.order_send_loader');
            submit.attr('disabled', true);
            loader.show();
            $.ajax({
                url: form.attr('action'),
                data: form.serialize(),
                type: 'POST',
                dataType: 'JSON',
                success: function(data, statusText, xhr, $form){
                    submit.attr('disabled', false);
                    loader.hide();
                    message.html(data.msg);
                    if(message.is(':hidden')){
                        message.stop(true).slideDown(200);
                    }
                    clearTimeout(forms_timeout[id]);
                    if(data.state){
                        // del user form from cookie
                        eraseCookie('form_data['+id+']');
                        push_to_ga('form_'+id+'_submit');
                        message.siblings('input').hide();
                        form.find(':text, textarea').val('');
                        setTimeout(function(){
                            message.html('');
                            message.siblings('input').show();
                        }, 7000);
                    }else{
                        if(typeof forms_timeout[id] == 'undefined'){
                            forms_timeout[id] = [];
                        }
                        forms_timeout[id] = setTimeout(function(){
                            message.stop(true).slideUp(200);
                        }, 5000);
                    }
                }
            });
            return false;
        });
        
        $('.section_hint', $global_context).click(function(){
            var id = $(this).data('id');
            $('#section_hint_text'+id, $global_context).show();
        });
        
        var hints_timeout = [];
        $('.section_hint_text', $global_context).mouseleave(function(){
            var $this = $(this),
                id = $this.data('id');
            hints_timeout[id] = setTimeout(function(){
                $this.hide();
            }, 1000);
        }).mouseenter(function(){
            var id = $(this).data('id');
            if(typeof(hints_timeout[id]) != 'undefined'){
                clearTimeout(hints_timeout[id]);
            }
        });
        
        if($frame_2_inner.length){
            var $double_bg_wrappers = $('.c_double_bg', $global_context);
            $double_bg_wrappers.each(function(){
                var $this = $(this),
                    $structure = $this,
                    $btn_move_structure = $('.btn_move', $this),
                    $structure_res_frame = $('.frame_2', $this);
                if($.support.touch){
                    $btn_move_structure.bind('touchstart', function(){
                        $structure.bind('touchmove', function(e){
                            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
                            var x = touch.pageX;
                            $structure_res_frame.css({
                                left: x
                            });
                            return false;
                        });
                    }).bind('touchend', function(){
                        $structure.unbind('touchmove');
                    });
                }else{
                    $btn_move_structure.mousedown(function(){
                        $structure.bind('mousemove', function(e){
                            var x = e.pageX - $global_context.offset().left;
                            $structure_res_frame.css({
                                left: x
                            });
                        });
                        return false;
                    }).mouseup(function(){
                        $structure.unbind('mousemove');
                    });
                }
                $structure.bind('mouseup mouseleave', function(){
                    $structure.unbind('mousemove');
                });
            });
        }
       
        var $sliders = $('.slider', $global_context);
        if($sliders.length){
            $sliders.each(function(){
                var $slider = $(this),
                    $slider_arrows = $('.slider_nav', $slider),
                    $slider_navs = $('.slides_nav_dots li', $slider);
                $slider_navs.click(function(){
                    var $this = $(this);
                    if(!$this.hasClass('active') && !index_slider_move){
                        index_slider_move_items($slider, 0, true, $this.data('index'));
                    }
                });
                $slider_arrows.click(function(){
                    var $this = $(this);
                    if(!$this.hasClass('cat_nav_disabled')){
                        var delta = $this.hasClass('cat_left') ? -1 : 1;
                        index_slider_move_items($slider, delta);
                    }
                });
            });
        }
        
        // popup windows
        $('.show_popup', $global_context).click(function(){
            var $this = $(this),
                $alpha = $('#popup_alpha'),
                id = $this.data('id'),
                $form = $('#popup_'+id);
            $form.css({
                top: -$form.outerHeight(true)
            }).show().animate({
                top: $(window).height() / 2 - $form.outerHeight(true) / 2
            }, 300);
            $alpha.fadeIn(300);
        });
        $('.popup_close', $global_context).click(function(){
            $('#popup_alpha').fadeOut(300);
            var $form = $(this).parents('.popup_window');
            $form.animate({
                top: -$form.outerHeight(true)
            }, 250, function(){
                $(this).hide();
            });
        });
        $(window).resize(function(){
            var $forms = $('.popup_window');
            $forms.each(function(){
                var $this = $(this);
                $this.css({
                    top: $(window).height() / 2 - $this.outerHeight(true) / 2
                });
            });
        });
        // / popup windows
        
        $('.header_form_add_btn').click(function(){
            push_to_ga('header_link_under_button');
        });
        
        if($.browser.msie && $.browser.version < 8){
            $.reject({ 
                reject: {   
                    all: false,  
                    msie5: true,
                    msie6: true,
                    msie7: true
                },
                browserInfo: {
                    chrome: {
                        text: 'Chrome',
                        url: 'http:\/\/www.google.com/chrome/'
                    },
                    firefox: {
                        text: 'Firefox', // Text below the icon
                        url: 'http:\/\/www.mozilla.com/firefox/' // URL For icon/text link
                    },
                    opera: {
                        text: 'Opera',
                        url: 'http:\/\/www.opera.com/download/'
                    }
                },
                display: ['firefox','chrome','opera'],
                header: 'Вы знаете, что ваш браузер Internet Explorer очень устарел?',
                paragraph1: 'Ваш браузер устарел и может не корректно отображать наш и другие современные сайты. Список наиболее популярных браузеров находится нниже.', // Paragraph 1
                paragraph2: 'Выберите любую из предложеных иконок и вы попадете на страницу загрузки.<br><br>', // Paragraph 2
                closeLink: '',
                closeMessage: 'Загрузите и установите современный браузер и сново зайдите на сайт.',
                imagePath: l_prefix+'images/'
            });
        }
        
    })();
    
}