/*
  glDatePicker - A simple, customizable, lightweight date picker calendar plugin for jQuery

  Downloads, examples, and instructions available at:
  http://code.gautamlad.com/glDatePicker/

  Complete project source available at:
  https://github.com/glad/glDatePicker/

  Copyright (c) 2011 Gautam Lad.  All rights reserved.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

  Changelog:
    Version 1.3 - Sat Feb 4 2012
      - Fixed missing div and closing properly on IE7/8

    Version 1.2 - Sat Aug 19 2011
      - Fixed the issue where the end date for a given month was actually that of the previous month's

    Version 1.1 - Sat Aug 6 2011
      - Last date shown incorrectly after selecting it
      - Introduces selectedDate option for visually indicating selected date
      - Selected date can also be set
      - Homepage updated with selectedDate example (in #4)
      - Syntaxhighlighter files referenced locally
      - Updated styles with selectedDate class

    Version 1.0 - Mon Aug 1 2011
      - Initial release
*/
(function($)
{
  var defaults =
  {
    calId: 0,
    cssName: "default",
    startDate: -1,
    endDate: -1,
    selectedDate: -1,
    showPrevNext: true,
    allowOld: true,
    showAlways: false,
    position: "absolute",
    calendarClass: "",
    timePicker: false,
    show24Hour: false,
    buttonText: "Done",
    format: false,  // only available if datejs is included, will default to current if not
    enableText: false // only available if datejs is included, will allow for thing like "tomorrow", "next week", "next month" to be entered into the text field to update the calendar
  };

  var methods =
  {
    init: function(options)
    {
      
      var thisDocument = $(document);
      var documentEvents = thisDocument.data('events');
      var bindClickEvent = true;

      if(documentEvents && documentEvents.click) {
        for(var i = 0; i < documentEvents.click.length; i++) {
          if(documentEvents.click[i].data.name == 'gldp') {
            bindClickEvent = false;
            break;
          }
        }
      }

      if(bindClickEvent) {
        // Bind click elsewhere to hide
        thisDocument.bind("click", {name:'gldp'}, function(e)
        {
          methods.hide.apply($("._gldp"));
        });
      }

      return this.each(function()
      {
        var self = $(this);
        var settings = $.extend({}, defaults);

        // Save the settings and id
        settings.calId = self[0].id+"-gldp";
        if(options) { settings = $.extend(settings, options); }
        self.data("settings", settings);
        self.data("theDate", settings.selectedDate);

        // Bind click and focus event to show
        self
          .click(methods.show)
          .focus(methods.show);

        // If always showing, trigger click causing it to show
        if(settings.showAlways)
        {
          setTimeout(function() { self.trigger("focus"); }, 50);
        }

        if (Date.today) {
          settings.dateJsAvailable = true;
          // enable the ability to type a date as an expression to the input
          // ex.  tomorrow, next month, next year, next friday
          // see www.datejs.com
          if (settings.enableText) {
            self.bind("keyup", function(e) {
              // allow the backspace without doing anything
              if (e.keyCode == 8 || e.keyCode == 37 || e.keyCode == 39) {
                return;
              }

              if(e.keyCode == 13){
                e.stopPropagation();
                methods.setValue.apply(self);
                return false;
              }

              var val = $(this).val();
              if (!val || val == '') {
                methods.setSelectedDate.apply(self, [-1]);
                methods.update.apply(self);
              } else {
                try {
                  // attempt to parse the date
                  var newDate = Date.parse(val);
                  if (helpers.validDate(newDate, settings.startDate, settings.endDate)) {
                    methods.setSelectedDate.apply(self, [newDate]);
                    methods.update.apply(self);
                  }
                } catch (err) {}
              }
            });
          }
        } else {
          settings.dateJsAvailable = false;
        }
      });
    },

    // Show the calendar
    show: function(e)
    {
      e.stopPropagation();

      // Instead of catching blur we'll find anything that's made visible
      methods.hide.apply($("._gldp").not($(this)));

      methods.update.apply($(this));
    },

    // Hide the calendar
    hide: function()
    {
      var target = $(this);
      if(target.length)
      {
        var s = target.data("settings");

        // Hide if not showing always and if the time picker is not enabled
        if(!s.showAlways)
        {
          // Hide the calendar and remove class from target
          $("#"+s.calId).slideUp(200);
          target.removeClass("_gldp");
        }

        methods.setValue.apply(target);
      }
    },

    // Set the value of the target, formatting the current date
    setValue: function() {
      var target = $(this);
      var settings = target.data("settings");
      var theDate = settings.selectedDate//target.data("theDate");
      if (theDate && theDate != -1) {
        if (settings.dateJsAvailable && settings.format) {
          target.val(theDate.toString(settings.format));
        } else {
          var val = (theDate.getMonth()+1)+"/"+theDate.getDate()+"/"+theDate.getFullYear();
          
          if (settings.timePicker) {
            if (settings.show24Hour) {
              val = val + " " + helpers.leadZero(theDate.getHours()) + ":" + helpers.leadZero(theDate.getMinutes());
            } else {
              val = val + " " + helpers.leadZero((theDate.getHours() > 12 ? theDate.getHours() - 12 : theDate.getHours() == 0 ? 12 : theDate.getHours())) + ":" + helpers.leadZero(theDate.getMinutes()) + " " + (theDate.getHours() > 11 ? "PM" : "AM");
            }
          }

          target.val(val);
        }
      } else {
        target.val('');
      }
    },

    // Set a new start date
    setStartDate: function(e)
    {
      $(this).data("settings").startDate = e;
    },

    // Set a new end date
    setEndDate: function(e)
    {
      $(this).data("settings").endDate = e;
    },

    // Set a new selected date
    setSelectedDate: function(newDate, updateDisplay)
    {
      // $(this).data("settings").selectedDate = newDate;
      var target = $(this);
      var settings = target.data("settings");

      target.data("theDate", newDate);
      settings.selectedDate = newDate;

      if (updateDisplay) {
        methods.setValue.apply(target);
      }

      // Run callback to user-defined date change method
      if(settings.onChange != null && typeof settings.onChange != "undefined")
      {
        settings.onChange(target, newDate);
      }
    },

    // Render the calendar
    update:function()
    {
      var target = $(this);
      var settings = target.data("settings");

      // Get the calendar id
      var calId = settings.calId;

      // Get the starting date
      var startDate = settings.startDate;
      if(settings.startDate == -1)
      {
        startDate = new Date();
        startDate.setDate(1);
      }

      // Get the end date
      var endDate = new Date(0);
      if(settings.endDate != -1)
      {
        endDate = new Date(settings.endDate);
        if((/^\d+$/).test(settings.endDate))
        {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate()+settings.endDate);
        }
      }

      // Get the selected date
      var selectedDate = new Date(0);
      if(settings.selectedDate != -1)
      {
        selectedDate = new Date(settings.selectedDate);
        if((/^\d+$/).test(settings.selectedDate))
        {
          selectedDate = new Date(startDate);
          selectedDate.setDate(selectedDate.getDate()+settings.selectedDate);
        }
      }

      // Get the current date to render
      var theDate = target.data("theDate");
      //  theDate = (theDate == -1 || typeof theDate == "undefined") ? startDate : theDate;
      theDate = (theDate == -1 || typeof theDate == "undefined") ? ((settings.selectedDate != -1 && typeof settings.selectedDate != "undefined") ? selectedDate : startDate) : theDate;
      
      // Save current date
      // because of the timePicker, need to create a new Date() using the current theDate because of zeroing out the time
      theDate = new Date(theDate);
      target.data("theDate", theDate);

      var startTime = startDate.setHours(0,0,0,0);
      var endTime = endDate.setHours(0,0,0,0);
      var selectedTime = selectedDate.setHours(0,0,0,0);

      // Calculate the first and last date in month being rendered.
      // Also calculate the weekday to start rendering on
      var firstDate = new Date(theDate); firstDate.setDate(1);
      var firstTime = firstDate.getTime();
      var lastDate = new Date(firstDate); lastDate.setMonth(lastDate.getMonth()+1); lastDate.setDate(0);
      var lastTime = lastDate.getTime();
      var lastDay = lastDate.getDate();

      // Calculate the last day in previous month
      var prevDateLastDay = new Date(firstDate);
        prevDateLastDay.setDate(0);
        prevDateLastDay = prevDateLastDay.getDate();

      // The month names to show in toolbar
      var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      // Render the cells as <TD>
      var days = "";
      for(var y = 0, i = 0; y < 6; y++)
      {
        var row = "";

        for(var x = 0; x < 7; x++, i++)
        {
          var p = ((prevDateLastDay - firstDate.getDay()) + i + 1);
          var n = p - prevDateLastDay;
          var c = (x == 0) ? "sun" : ((x == 6) ? "sat" : "day");

          // If value is outside of bounds its likely previous and next months
          if(n >= 1 && n <= lastDay)
          {
            var today = new Date(); today.setHours(0,0,0,0);
            var date = new Date(theDate); date.setHours(0,0,0,0); date.setDate(n);
            var dateTime = date.getTime();

            // Test to see if it's today
            c = (today.getTime() == dateTime) ? "today":c;

            // Test to see if we allow old dates
            if(!settings.allowOld)
            {
              c = (dateTime < startTime) ? "noday":c;
            }

            // Test against end date
            if(settings.endDate != -1)
            {
              c = (dateTime > endTime) ? "noday":c;
            }

            // Test against selected date
            if(settings.selectedDate != -1)
            {
              c = (dateTime == selectedTime) ? ("selected " + c):c;
            }
          }
          else
          {
            c = "noday"; // Prev/Next month dates are non-selectable by default
            n = (n <= 0) ? p : ((p - lastDay) - prevDateLastDay);
          }

          // Create the cell
          row += "<td class='gldp-days "+c+" **-"+c+"'><div class='"+c+"'>"+n+"</div></td>";
        }

        // Create the row
        days += "<tr class='days'>"+row+"</tr>";
      }

      // Determine whether to show Previous arrow
      var showP = ((startTime < firstTime) || settings.allowOld);
      var showN = ((lastTime < endTime) || (endTime < startTime));

      // Force override to showPrevNext on false
      if(!settings.showPrevNext) { showP = showN = false; }

      // Build the html for the control
      var titleMonthYear = monthNames[theDate.getMonth()]+" "+theDate.getFullYear();
      var html =
        "<div class='**'>"+
          "<table>"+
            "<tr>"+ /* Prev Month/Year Next*/
              ("<td class='**-prevnext prev'>"+(showP ? "◄":"")+"</td>")+
              "<td class='**-monyear' colspan='5'>{MY}</td>"+
              ("<td class='**-prevnext next'>"+(showN ? "►":"")+"</td>")+
            "</tr>"+
            "<tr class='**-dow'>"+ /* Day of Week */
              "<td>Sun</td><td>Mon</td><td>Tue</td><td>Wed</td><td>Thu</td><td>Fri</td><td>Sat</td>"+
            "</tr>"+days;

      // Add in the time picker html
      if (settings.timePicker) {
        html += "<tr class='time'><td colspan='7' class='**-time'>"+
          '<input type="text" class="**-timeentry hour" maxlength="2" value="'+helpers.leadZero(settings.show24Hour ? theDate.getHours() : (theDate.getHours() > 12 ? theDate.getHours() - 12 : theDate.getHours() == 0 ? 12 : theDate.getHours()))+'" />'+
          '<div class="separator">:</div><input type="text" class="**-timeentry minutes" maxlength="2" value="'+helpers.leadZero(theDate.getMinutes())+'">';

          // Only show the ampm input if not showing a 24 hour clock
          if (!settings.show24Hour) {
            html += '<input type="button" class="**-btnampm ampm' + (theDate.getHours() >= 12 ? '' : ' selected') + '" value="AM" /><input type="button" class="**-btnampm ampm' + (theDate.getHours() >= 12 ? ' selected' : '') + '" value="PM" />'
          }
          
          html += "</td></tr>"+
          "<tr class='time'><td colspan='7'><input type='button' value='" + settings.buttonText + "' class='**-done' /></td></tr>"
      }

      html += "</table>"+
        "</div>";

      // Replace css, month-year title
      html = (html.replace(/\*{2}/gi, "gldp-"+settings.cssName)).replace(/\{MY\}/gi, titleMonthYear);

      // If calendar doesn't exist, make one
      if($("#"+calId).length == 0)
      {
        target.after
        (
           $("<div id='"+calId+"' class='" + settings.calendarClass + "'></div>")
          .css({
            "position":settings.position,
            "z-index":settings.zIndex,
            "left":settings.autoPosition ? 'auto' : (target.offset().left),
            "top":settings.autoPosition ? 'auto' : (target.offset().top+target.outerHeight(true))
          })
        );
      }

      // Show calendar
      var calendar = $("#"+calId);
      calendar.html(html).slideDown(200);

      // Add a class to make it easier to find when hiding
      target.addClass("_gldp");

      // if the timePicker is enabled, add the click event on the button
      if (settings.timePicker) {
        var numericKeydown = function(event) {
          // Allow: backspace, delete, tab, escape, and enter
            if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 || 
                // Allow: Ctrl+A
                (event.keyCode == 65 && event.ctrlKey === true) || 
                 // Allow: home, end, left, right
                (event.keyCode >= 35 && event.keyCode <= 39)) {
              // let it happen, don't do anything
              return;
            }
            else {
              // Ensure that it is a number and stop the keypress
              if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
                 event.preventDefault(); 
              }   
            }
          };

        var numericFocusout = function(event) {
          var thisInput = $(this);
          if (thisInput.val() == '') {
            thisInput.val(helpers.leadZero(0));
          }
        };

        $("tr.time", calendar).click(function(e) { e.stopPropagation(); });

        if ($.fn.mousewheel) {
          // setup the mousewheel on the hour field
          $("input.hour", calendar).mousewheel($.proxy(function(e, d, dx, dy) {
            e.preventDefault();
            e.stopPropagation();

            var i = $(e.target);
            v = parseInt(i.val(), 10);
            i.focus();

            if(settings.show24Hour) {
              if(dy > 0) {
                v = (v < 23) ? v + 1 : 0;
              }
              else if(dy < 0) {
                v = (v > 0) ? v - 1 : 23;
              }
            }
            else {
              var ampm = $("input.gldp-"+ settings.cssName + "-btnampm", calendar);
              if(dy > 0) {
                if(v == 11) {
                  v = 12;
                  //ampm.val(ampm.val() == 'AM' ? 'PM' : 'AM');
                  ampm.toggleClass("selected");
                }
                else if(v < 12) {
                  v++;
                }
                else {
                  v = 1;
                }
              }
              else if (dy < 0) {
                if(v == 12) {
                  v = 11;
                  // ampm.val(ampm.val() == 'AM' ? 'PM' : 'AM');
                  ampm.toggleClass("selected");
                }
                else if(v > 1) {
                  v--;
                }
                else {
                  v = 12;
                }
              }
            }

            i.val(helpers.leadZero(v));
          })).keydown(numericKeydown).focusout(numericFocusout);

          $("input.minutes", calendar).mousewheel($.proxy(function(e, d, dx, dy) {
            e.preventDefault();
            e.stopPropagation();

            var i = $(e.target), v = parseInt(i.val(), 10);
            i.focus();
            if(dy > 0) {
              v = (v < 59) ? v + 1 : 0;
            }
            else if(dy < 0) {
              v = (v > 0) ? v - 1 : 59;
            }

            i.val(helpers.leadZero(v));
          }, this)).keydown(numericKeydown).focusout(numericFocusout);

          $("input.gldp-"+ settings.cssName + "-btnampm", calendar).click(function() {
            $(this).addClass("selected").siblings("input.gldp-"+ settings.cssName + "-btnampm").removeClass("selected");
            return false;
          });
        }

        $("[class*=-done]", calendar).click(function(e) {
          e.stopPropagation();

          var settings = target.data("settings");
          var time = $(this).closest("tr").siblings("tr.time").children("td.gldp-"+settings.cssName + "-time");

          var newDate = target.data("newDate");
          target.removeData("newDate");
          if (!newDate) {
            newDate = new Date(target.data("theDate"));
          }

          var hour = parseInt(time.children("input.hour").val(), 10);
          var minutes = parseInt(time.children("input.minutes").val(), 10);

          if (isNaN(hour)) {
            hour = 0;
          }

          if (isNaN(minutes)) {
            minutes = 0;
          }

          if (!settings.show24Hour) {
            var ampm = time.children("input.gldp-"+ settings.cssName + "-btnampm.selected").val().toUpperCase();
            if (ampm == "PM" && hour != 12) {
              hour += 12;
            } else if (ampm == "AM" && hour == 12) {
              hour = 0;
            }
          }

          newDate.setHours(hour, minutes, 0, 0);

          // Save selected
          if (helpers.validDate(newDate, settings.startDate, settings.endDate)) {
            target.data("theDate", newDate);
            settings.selectedDate = newDate;

            methods.setValue.apply(target);

            // Run callback to user-defined date change method
            if(settings.onChange != null && typeof settings.onChange != "undefined")
            {
              settings.onChange(target, newDate);
            }
          }

          // Hide calendar
          methods.hide.apply(target);
        });
      }

      // Handle previous/next clicks
      $("[class*=-prevnext]", calendar).click(function(e)
      {
        e.stopPropagation();

        if($(this).html() != "")
        {
          // Determine offset and set new date
          var offset = $(this).hasClass("prev") ? -1 : 1;
          var newDate = new Date(firstDate);
            newDate.setMonth(theDate.getMonth()+offset);

          // Save the new date and render the change
          target.data("theDate", newDate);
          methods.update.apply(target);
        }
      });

      // if text is enabled, there needs to be some way to click on the selected day
      // because the text will update the date in the calendar
      if (settings.enableText) {
        $("tr.days td.selected", calendar).click(function(e) {
          e.stopPropagation();
          methods.setValue.apply(target);
          methods.hide.apply(target);
        });
      }

      // Highlight day cell on hover
      $("tr.days td:not(.noday)", calendar)
        .mouseenter(function(e)
        {
          if (!$(this).hasClass("selected"))
          {
            var css = "gldp-"+settings.cssName+"-"+$(this).children("div").attr("class");
            $(this).removeClass(css).addClass(css+"-hover");
          }
        })
        .mouseleave(function(e)
        {
          if(!$(this).hasClass("selected"))
          {
            var css = "gldp-"+settings.cssName+"-"+$(this).children("div").attr("class");
            $(this).removeClass(css+"-hover").addClass(css);
          }
        })
        .click(function(e)
        {
          e.stopPropagation();
          var day = $(this).children("div").html();
          var settings = target.data("settings");
          var newDate = new Date(theDate); newDate.setDate(day);

          // Save the new date and update the target control
          target.data("newDate", newDate);

          // set the value and call the change events only if the timePicker is not enabled
          if (!settings.timePicker) {
            target.data("theDate", newDate);

            methods.setValue.apply(target);

            // Run callback to user-defined date change method
            if(settings.onChange != null && typeof settings.onChange != "undefined")
            {
              settings.onChange(target, newDate);
            }

            // Save selected
            settings.selectedDate = newDate;

            // Hide calendar
            methods.hide.apply(target);
          } else {
            var prefix = "gldp-"+settings.cssName+"-";

            var newSelected = $(this);
            var oldSelected = calendar.find("td.selected");

            // remove the selected class from the old selected td and its child div
            oldSelected.removeClass("selected").children().removeClass("selected");
            // remove the prefix + selected from the td
            oldSelected.removeClass(prefix + "selected");
            // create the css class that needs to be added to the td
            var oldSelectedCss = prefix+oldSelected.children("div").attr("class");
            oldSelected.addClass(oldSelectedCss);

            // determine the new selected tds class
            var newSelectedCss = prefix+newSelected.children("div").attr("class");
            // remove the hover class (there because we have clicked it) and remove the default type class
            newSelected.removeClass(newSelectedCss + "-hover").removeClass(newSelectedCss);
            // add the selected class to the td and the div and add the prefix + selected to the td
            newSelected.addClass("selected").addClass(prefix + "selected").children().addClass("selected");
          }
        });
    }
  };

  var helpers = 
  {
    leadZero: function(v) {
      return v < 10 ? '0'+v : v;
    },
    validDate: function(newDate, startDate, endDate) {
      // console.log("validDate: " + newDate + ", " + startDate + ", " + endDate);

      if (!newDate) {
        // console.log("no new date");
        return false;
      }

      if (startDate != -1 && (newDate < startDate)) {
        // console.log("bad because of startDate");
        return false;
      }

      if (endDate != -1 && (newDate > endDate)) {
        // console.log("bad because of endDate");
        return false;
      }

      return true;
    }
  };

  // Plugin entry
  $.fn.glDatePicker = function(method)
  {
    if(methods[method]) { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); }
    else if(typeof method === "object" || !method) { return methods.init.apply(this, arguments); }
    else { $.error("Method "+ method + " does not exist on jQuery.glDatePicker"); }
  };
})(jQuery);