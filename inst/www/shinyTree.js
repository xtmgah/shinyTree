var shinyTree = function(){
  var treeOutput = new Shiny.OutputBinding();
  $.extend(treeOutput, {
    find: function(scope) {
      return $(scope).find('.shiny-tree');
    },
    renderValue: function(el, data) {
      // Wipe the existing tree and create a new one.
      $elem = $('#' + el.id)
      $elem.html(data);
      var plugins = [];
      if ($elem.data('st-checkbox') === 'TRUE'){
        plugins = ['checkbox'];
      }
      
      var tree = $.jstree.create(el, {plugins: plugins});
      // Can't seem to find a way to recover this tree reference using their API,
      // so we'll just store the object here.
      $elem.data('shinyTree', tree);
      
      var selectedId = $elem.data('st-selected')
      if (selectedId) {
        $elem.on("changed.jstree", function(e, data) {
          // Get $elements
          var $sels = $('#' + data.selected.join(',#'))
          // Remove descendant nodes in the clone before getting text.
          // TODO: We don't really want to trim but have to b/c of Shiny's pretty-printing.
          var names = $sels.map(function(i, el){return $(el).clone().find('ul').remove().end().text().trim(); }).get()
          Shiny.onInputChange(selectedId, names)
        });
      }
    }
  });
  Shiny.outputBindings.register(treeOutput, 'shinyTree.treeOutput');
  
  var treeInput = new Shiny.InputBinding();
  $.extend(treeInput, {
    find: function(scope) {
      return $(scope).find(".shiny-tree");
    },
    getValue: function(el, keys) {
      /**
       * Prune an object recursively to only include the specified keys
       **/
      var prune = function(arr, keys){
        var arrToObj = function(ar){
          var obj = {};
          $.each(ar, function(i, el){
            obj['' + i] = el;
          })
          return obj;
        }
        
        var toReturn = [];
        // Ensure 'children' property is retained.
        keys.push('children');
        
        $.each(arr, function(i, obj){
          if (obj.children && obj.children.length > 0){
            obj.children = arrToObj(prune(obj.children, keys));
          }
          var clean = {};
          $.each(obj, function(key, val){
            if (keys.indexOf(key) >= 0){
              if (typeof obj[key] === 'string'){
                // TODO: We don't really want to trim but have to b/c of Shiny's pretty-printing.
                clean[key] = obj[key].trim();
              } else {
                clean[key] = obj[key]; 
              }
            }
          });
          toReturn.push(clean);
        });
        return arrToObj(toReturn);
      }
      
      var tree = $(el).data('shinyTree');
      if (tree){ // May not be loaded yet.
        var js = tree.get_json();
        var pruned =  prune(js, ['state', 'text']);
        return pruned;
      }
      
    },
    setValue: function(el, value) {},
    subscribe: function(el, callback) {
      $(el).on("open_node.jstree", function(e) {
        callback();
      });
      
      $(el).on("close_node.jstree", function(e) {
        callback();
      });
      
      $(el).on("changed.jstree", function(e) {
        callback();
      });
      
      $(el).on("ready.jstree", function(e){
        // Initialize the data.
        callback();
      })
    },
    unsubscribe: function(el) {
      $(el).off(".jstree");
    }
  });
  
  Shiny.inputBindings.register(treeInput); 
}()