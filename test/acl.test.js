var assert = require('assert');
var loopback = require('../index');
var acl = require('../lib/models/acl');
var Scope = acl.Scope;
var ACL = acl.ACL;
var ScopeACL = acl.ScopeACL;
var User = loopback.User;

function checkResult(err, result) {
  // console.log(err, result);
  assert(!err);
}

describe('security scopes', function () {

  it("should allow access to models for the given scope by wildcard", function () {
    Scope.create({name: 'userScope', description: 'access user information'}, function (err, scope) {
      ACL.create({principalType: ACL.SCOPE, principalId: scope.id, model: 'User', property: ACL.ALL,
          accessType: ACL.ALL, permission: ACL.ALLOW},
        function (err, resource) {
        Scope.checkPermission('userScope', 'User', ACL.ALL, ACL.ALL, checkResult);
        Scope.checkPermission('userScope', 'User', 'name', ACL.ALL, checkResult);
        Scope.checkPermission('userScope', 'User', 'name', ACL.READ, checkResult);
      });
    });

  });

  it("should allow access to models for the given scope", function () {
    var ds = loopback.createDataSource({connector: loopback.Memory});
    Scope.create({name: 'userScope', description: 'access user information'}, function (err, scope) {
      ACL.create({principalType: ACL.SCOPE, principalId: scope.id,
          model: 'User', property: 'name', accessType: ACL.READ, permission: ACL.ALLOW},
        function (err, resource) {
          ACL.create({principalType: ACL.SCOPE, principalId: scope.id,
              model: 'User', property: 'name', accessType: ACL.WRITE, permission: ACL.DENY},
            function (err, resource) {
              // console.log(resource);
              Scope.checkPermission('userScope', 'User', ACL.ALL, ACL.ALL, function (err, perm) {
                assert(perm.permission === ACL.DENY); // because name.WRITE == DENY
              });
              Scope.checkPermission('userScope', 'User', 'name', ACL.ALL, function (err, perm) {
                assert(perm.permission === ACL.DENY); // because name.WRITE == DENY
              });
              Scope.checkPermission('userScope', 'User', 'name', ACL.READ, function (err, perm) {
                assert(perm.permission === ACL.ALLOW);
              });
              Scope.checkPermission('userScope', 'User', 'name', ACL.WRITE, function (err, perm) {
                assert(perm.permission === ACL.DENY);
              });
            });
        });
    });

  });

});

describe('security ACLs', function () {

  it("should allow access to models for the given principal by wildcard", function () {
    var ds = loopback.createDataSource({connector: loopback.Memory});

    ACL.create({principalType: ACL.USER, principalId: 'u001', model: 'User', property: ACL.ALL,
      accessType: ACL.ALL, permission: ACL.ALLOW}, function (err, acl) {

      ACL.create({principalType: ACL.USER, principalId: 'u001', model: 'User', property: ACL.ALL,
        accessType: ACL.READ, permission: ACL.DENY}, function (err, acl) {

        ACL.checkPermission(ACL.USER, 'u001', 'User', 'name', ACL.READ, function (err, perm) {
          assert(perm.permission === ACL.DENY);
        });

        ACL.checkPermission(ACL.USER, 'u001', 'User', 'name', ACL.ALL, function (err, perm) {
          assert(perm.permission === ACL.DENY);
        });

      });

    });

  });

  it("should honor static ACLs from the model", function () {
    var ds = loopback.createDataSource({connector: loopback.Memory});
    var Customer = ds.createModel('Customer', {
      name: {
        type: String,
        acls: [
          {principalType: ACL.USER, principalId: 'u001', accessType: ACL.WRITE, permission: ACL.DENY},
          {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
        ]
      }
    }, {
      acls: [
        {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
      ]
    });

    /*
     Customer.settings.acls = [
     {principalType: ACL.USER, principalId: 'u001', accessType: ACL.ALL, permission: ACL.ALLOW}
     ];
     */

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.WRITE, function (err, perm) {
      assert(perm.permission === ACL.DENY);
    });

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.READ, function (err, perm) {
      assert(perm.permission === ACL.ALLOW);
    });

    ACL.checkPermission(ACL.USER, 'u001', 'Customer', 'name', ACL.ALL, function (err, perm) {
      assert(perm.permission === ACL.DENY);
    });

  });


});



