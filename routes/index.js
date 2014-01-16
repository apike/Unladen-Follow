
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Unladen Follow' });

};

exports.scan = function(req, res){
  res.render('scan', { title: 'Unladen Follow' });

};
