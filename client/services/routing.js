import auth from './autorization.js';
import admin from './../account/admin.vue';
import home from './../home.vue';
import login from './../login.vue';

// let router = new Router({
let router = new Router({
    // mode: 'history',    
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
          path: '/Home',
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
  })
  
  router.beforeEach((to, from, next) => {    
    if (to.meta.authentication && !auth.isLoggedIn) {
      next('/Login')
    }    
    else if(to.meta.admin && !auth.isAdmin) {
      next('/Home');
    }
    else{
        next();
    }
  })

//   const app = new Vue({
//     router
//   }).$mount('#app')

Vue.use(router);