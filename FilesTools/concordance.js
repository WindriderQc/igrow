function Concordance() {
    this.dict = {};
    this.keys = [];

    this.process = (str) => {
        str = str.replace(/(^\s*)|(\s*$)/gi,"");
        str = str.replace(/[ ]{2,}/gi," ");
        str = str.replace(/\n /,"\n");
        return str.split(' ').length;
        }

  }

  

  module.exports = Concordance;