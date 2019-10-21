import Vue from 'vue';
import VueRouter from 'vue-router';
import auth from './../services/autorization.js';
import Admin from './../views/account/Admin.vue';
import Home from './../views/Home.vue';
import Login from './../views/Login.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/Admin',
    name: 'Admin',
    component: Admin,
    meta: {
        authentication: true,
        admin: true
    }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
        authentication: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta:{}
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
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
