define('error-stack-parser', ['stackframe'], function (StackFrame) {
  return {
    parse: function (err) {
      try {
        if (!err) return [];
        var stackStr = (err.stack || '').toString();
        var lines = stackStr.split('\n');
        return lines.map(function () {
          return new StackFrame({});
        });
      } catch (e) {
        return [];
      }
    }
  };
});
