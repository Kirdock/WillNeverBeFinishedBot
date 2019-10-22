<template>
    <div class="container" style="margin-top:50px">
        <div id="fetch" class="form-horizontal" >
            <button type="button" class="btn btn-primary" v-on:click="updateWebsite()" v-if="isAdmin">Update Website</button>
            <button type="button" class="btn btn-primary" @click="testToast()" >TestToast</button>
            <h1 class="control-label">Server</h1>
            <div class="input-group">
                <select class="form-control" v-model="selectedServer" @change="fetchChannels(); saveSettings()">
                    <option v-for="server in servers" :value="server.id" :key="server.id">
                        {{server.name}}
                    </option>
                </select>
                <button type="button" class="btn btn-primary col-md-2" v-on:click="updateServerList()">Update Serverlist</button>
            </div>

            <h1>Sound Upload</h1>

            <div class="form-group">
                <label class="control-label">Create new Category</label>
                <div class="input-group">
                    <input class="form-control col-md-10" v-model="newCatInput">
                    <button type="button" class="btn btn-primary col-md-2" id="newCat" v-on:click="createNewCat()">Create New Cat</button>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label">Choose sound category</label>
                <div class="input-group">
                    <select class="form-control" v-model="selectedCategory">
                        <option v-for="category in soundCategories" :value="category.name" :key="category">
                            {{category.name}}
                        </option>
                    </select>
                    <label class="btn btn-primary col-md-2 finger">
                        Browse.. <input type="file" style="display:none" id="file" ref="file" accept="audio/*" v-on:change="submitFile()"/>
                    </label>
                </div>
            </div>
                
            <h1>Play Sounds</h1>
            <div class="form-group ">
                <label class="control-label">Choose Channel</label>
                <select class="form-control" v-model="selectedChannel"  @change="saveSettings()">
                    <option v-for="channel in channels" :value="channel.id" :key="channel">
                        {{channel.name}}
                    </option>
                </select>
                <div class="form-check">
                    <input type="checkbox" class="form-check-input" id="joinUser" v-model="joinUser" @change="saveSettings()" >
                    <label class="form-check-label" for="joinUser">
                        Join to User
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label class="control-label">Volume</label>
                <input class="form-control col-md-1" type="number" v-model="volume" step="0.5" :max="maxVolume"  @change="saveSettings()">
            </div>
            
            <div class="form-group">
                <label class="control-label">Youtube URL</label>
                <div class="input-group">
                    <input class="form-control col-md-10" v-model="youtubeUrl">
                    <button type="button" class="btn btn-primary col-md-2" v-on:click="playSound()">Play</button>
                </div>
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-primary" v-on:click="stopPlaying()">Stop Playing</button>
            </div>
            <div class="form-group">
                <label class="control-label">Search</label>
                <input class="form-control" v-model="searchText">
            </div>
            <div class="form-group">
                <button type="button" class="btn btn-primary" v-on:click="setCategoriesVisibility(true)">Expand all categories</button>
                <button type="button" class="btn btn-primary" v-on:click="setCategoriesVisibility(false)">Collapse all categories</button>
            </div>
            
            <div v-for="category in soundCategories" :key="category">
                <h2 class="control-label">{{category.name}}</h2>
                <button type="button" class="btn btn-primary" v-on:click="changeCategoryVisibility(category)" style="width: 40px; height: 40px">{{category.show ? '-' : '+'}}</button>
                <table class="table text-break" v-show="category.show">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th style="width: 100px">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="sound in filteredSounds(category.name)" :key="sound">
                            <td>
                                {{sound.name}}
                            </td>
                            <td style="width: 100px">
                                <button type="button" class="btn btn-primary" v-on:click="playSound(sound.path)">Play</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</template>
<script src="./home.js"></script>