import Vue from 'vue';
import VueRouter from 'vue-router';
import Admin from '../views/account/Admin.vue';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import UserAccount from '../views/account/User.vue';

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
    path: '/Login',
    name: 'Login',
    component: Login,
    meta:{}
  },
  {
    path: '/Account',
    name: 'Account',
    component: UserAccount,
    meta:{
      authentication: true
    }
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
  {
    path: '*',
    name: 'NotFound',
    meta:{}
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to, from, next) => {
  if(to.name === 'Login' && router.app.$auth.isLoggedIn()){
    next('/');
  }
  else if (to.meta.authentication && !router.app.$auth.isLoggedIn()) {
    next('/Login');
  }    
  else if(to.meta.admin && !router.app.$auth.isAdmin()) {
    next('/');
  }
  else if(to.name === 'NotFound'){
    next(router.app.$auth.isLoggedIn() ? '/' : '/Login');
  }
  else{
      next();
  }
});

export default router;
