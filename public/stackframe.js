define('stackframe', [], function () {
  function StackFrame(props) {
    props = props || {};
    this.functionName = props.functionName || '';
    this.fileName = props.fileName || '';
    this.lineNumber = props.lineNumber || 0;
    this.columnNumber = props.columnNumber || 0;
  }
  StackFrame.prototype.toString = function () {
    return (this.functionName || '') + ' (' + (this.fileName || '') + ':' + (this.lineNumber || 0) + ':' + (this.columnNumber || 0) + ')';
  };
  return StackFrame;
});
