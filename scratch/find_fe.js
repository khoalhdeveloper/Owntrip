const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach((file) => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          // ignore node_modules and .git
          if (file.includes('node_modules') || file.includes('.git') || file.includes('.expo')) {
            if (!--pending) done(null, results);
          } else {
            walk(file, (err, res) => {
              results = results.concat(res);
              if (!--pending) done(null, results);
            });
          }
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const fePath = 'C:\\Users\\lekho\\OneDrive\\Documents\\SE183675\\Owntrip-fe';

walk(fePath, (err, files) => {
  if (err) throw err;
  const matches = [];
  files.forEach((file) => {
    if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('MissionProgressList')) {
        matches.push(file);
      }
    }
  });
  console.log('Files referencing MissionProgressList:', matches);
});
