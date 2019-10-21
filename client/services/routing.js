import auth from './autorization.js';
import admin from './../account/admin.vue';
import home from './../home.vue';
import login from './../login.vue';
import VueRouter from 'vue-router';

let router = new VueRouter({
    mode: 'history',    
    routes: [    
        {
          path: '/Admin',
          name: 'Admin',
          component: admin,
          meta: {
              authentication: true,
              admin: true
          }
        },
        {
          path: '/',
          name: 'Home',
          component: home,
          meta: {
              authentication: true
          }
        },
        {
          path: '/login',
          name: 'Login',
          component: login,
          meta:{}
        }
    ]
  });
  
  router.beforeEach((to, from, next) => {    
    if (to.meta.authentication && !auth.isLoggedIn) {
      next('/Login');
    }    
    else if(to.meta.admin && !auth.isAdmin) {
      next('/Home');
    }
    else{
        next();
    }
  });

export default router;