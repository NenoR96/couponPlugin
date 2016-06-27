'use strict';

(function (angular, buildfire) {
  angular
    .module('couponPluginContent')
    .controller('ContentHomeCtrl', ['$scope', 'TAG_NAMES','SORT','SORT_FILTER', 'STATUS_CODE', 'DataStore', 'LAYOUTS','Buildfire','Modals','RankOfLastFilter', 'RankOfLastItem',
      function ($scope, TAG_NAMES,SORT, SORT_FILTER, STATUS_CODE, DataStore, LAYOUTS, Buildfire, Modals, RankOfLastFilter, RankOfLastItem) {

        var ContentHome = this;
        ContentHome.filter=null;
        var _data = {
          "content": {
            "carouselImages": [],
            "description":'',
            "rankOfLastFilter" :''
          },
          "design": {
            "itemListLayout": LAYOUTS.itemListLayout[0].name
          },
          "settings": {
            "defaultView": "list",
            "distanceIn": "mi",
            mapView: "show",
            filterPage: "show"
          }
        };

        ContentHome.filters=[];

        ContentHome.items=[];

        ContentHome.sortFilterOptions=[
          SORT_FILTER.MANUALLY,
          SORT_FILTER.CATEGORY_NAME_A_Z,
          SORT_FILTER.CATEGORY_NAME_Z_A
        ];

        ContentHome.sortItemOptions=[
          SORT.MANUALLY,
          SORT.ITEM_TITLE_A_Z,
          SORT.ITEM_TITLE_Z_A,
          SORT.NEWEST_FIRST,
          SORT.OLDEST_FIRST,
          SORT.EXPIRATION_DATE_ASC,
          SORT.EXPIRATION_DATE_DESC
        ];

        ContentHome.searchOptions = {
          filter: {"$json.title": {"$regex": '/*'}},
          skip: SORT_FILTER._skip,
          limit: SORT_FILTER._limit + 1 // the plus one is to check if there are any more
        };


        ContentHome.searchOptionsForItems = {
          filter: {"$json.title": {"$regex": '/*'}},
          skip: SORT._skip,
          limit: SORT._limit + 1 // the plus one is to check if there are any more
        };
        /*
         * create an artificial delay so api isnt called on every character entered
         * */
        var tmrDelay = null;

        ContentHome.busy=false;
        RankOfLastFilter.setRank(0);
        RankOfLastItem.setRank(0);

        var updateMasterItem = function (data) {
          ContentHome.masterData = angular.copy(data);
        };


        var isUnchanged = function (data) {
          return angular.equals(data, ContentHome.masterData);
        };


        ContentHome.descriptionWYSIWYGOptions = {
          plugins: 'advlist autolink link image lists charmap print preview',
          skin: 'lightgray',
          trusted: true,
          theme: 'modern'
        };

        // create a new instance of the buildfire carousel editor
        var editor = new Buildfire.components.carousel.editor("#carousel");

        // this method will be called when a new item added to the list
        editor.onAddItems = function (items) {
          if (!ContentHome.data.content.carouselImages)
            ContentHome.data.content.carouselImages = [];
          ContentHome.data.content.carouselImages.push.apply(ContentHome.data.content.carouselImages, items);
          $scope.$digest();
        };
        // this method will be called when an item deleted from the list
        editor.onDeleteItem = function (item, index) {
          ContentHome.data.content.carouselImages.splice(index, 1);
          $scope.$digest();
        };
        // this method will be called when you edit item details
        editor.onItemChange = function (item, index) {
          ContentHome.data.content.carouselImages.splice(index, 1, item);
          $scope.$digest();
        };
        // this method will be called when you change the order of items
        editor.onOrderChange = function (item, oldIndex, newIndex) {
          var items = ContentHome.data.content.carouselImages;

          var tmp = items[oldIndex];

          if (oldIndex < newIndex) {
            for (var i = oldIndex + 1; i <= newIndex; i++) {
              items[i - 1] = items[i];
            }
          } else {
            for (var i = oldIndex - 1; i >= newIndex; i--) {
              items[i + 1] = items[i];
            }
          }
          items[newIndex] = tmp;

          ContentHome.data.content.carouselImages = items;
          $scope.$digest();
        };

        /**
         * ContentHome.itemSortableOptions used for ui-sortable directory to sort filter listing Manually.
         * @type object
         */
        ContentHome.filterSortableOptions = {
          handle: '> .cursor-grab',
          disabled: true,
          stop: function (e, ui) {
            var endIndex = ui.item.sortable.dropindex,
                maxRank = 0,
                draggedItem = ContentHome.filters[endIndex];

            if (draggedItem) {
              var prev = ContentHome.filters[endIndex - 1],
                  next = ContentHome.filters[endIndex + 1];
              var isRankChanged = false;
              if (next) {
                if (prev) {
                  draggedItem.data.rank = ((prev.data.rank || 0) + (next.data.rank || 0)) / 2;
                  isRankChanged = true;
                } else {
                  draggedItem.data.rank = (next.data.rank || 0) / 2;
                  isRankChanged = true;
                }
              } else {
                if (prev) {
                  draggedItem.data.rank = (((prev.data.rank || 0) * 2) + 10) / 2;
                  maxRank = draggedItem.data.rank;
                  isRankChanged = true;
                }
              }
              if (isRankChanged) {
                DataStore.update(draggedItem.id, draggedItem.data, TAG_NAMES.COUPON_CATEGORIES).then( function (success) {
                 if (ContentHome.data.content.rankOfLastFilter < maxRank) {
                    ContentHome.data.content.rankOfLastFilter = maxRank;
                    RankOfLastFilter.setRank(maxRank);
                  }
                },function(error) {
                    console.error('Error during updating rank');


                })
              }
            }
          }
        };

        ContentHome.itemSortableOptions = {
          handle: '> .cursor-grab-item',
          disabled: true,
          stop: function (e, ui) {
            var endIndex = ui.item.sortable.dropindex,
              maxRank = 0,
              draggedItem = ContentHome.items[endIndex];

            if (draggedItem) {
              var prev = ContentHome.items[endIndex - 1],
                next = ContentHome.items[endIndex + 1];
              var isRankChanged = false;
              if (next) {
                if (prev) {
                  draggedItem.data.rank = ((prev.data.rank || 0) + (next.data.rank || 0)) / 2;
                  isRankChanged = true;
                } else {
                  draggedItem.data.rank = (next.data.rank || 0) / 2;
                  isRankChanged = true;
                }
              } else {
                if (prev) {
                  draggedItem.data.rank = (((prev.data.rank || 0) * 2) + 10) / 2;
                  maxRank = draggedItem.data.rank;
                  isRankChanged = true;
                }
              }
              if (isRankChanged) {
                DataStore.update(draggedItem.id, draggedItem.data, TAG_NAMES.COUPON_ITEMS).then( function (success) {
                  if (ContentHome.data.content.rankOfLastItem < maxRank) {
                    ContentHome.data.content.rankOfLastItem = maxRank;
                    RankOfLastItem.setRank(maxRank);
                  }
                },function(error) {
                  console.error('Error during updating rank');


                })
              }
            }
          }
        };
        //ContentHome.itemSortableOptions.disabled = !(ContentHome.data.content.sortFilterBy === SORT_FILTER.MANUALLY);

        ContentHome.addEditFilter=function(filter, editFlag , index){
          var tempTitle='';
          if(filter)
            tempTitle=filter.title;
          Modals.addFilterModal({
            title: tempTitle,
            isEdit:editFlag
          }).then(function (response) {
            if (!(response.title === null || response.title.match(/^ *$/) !== null)) {

              //if index is there it means filter update operation is performed
              if(Number.isInteger(index)){
                ContentHome.filters[index].data.title= response.title;
              }else{
                ContentHome.filter={
                  data: {
                    title: response.title,
                    rank: RankOfLastFilter.getRank() + 10
                  }
                }
                ContentHome.data.content.rankOfLastFilter=RankOfLastFilter.getRank()+10;
                RankOfLastFilter.setRank(ContentHome.data.content.rankOfLastFilter);
                ContentHome.filters.unshift(ContentHome.filter);
                Buildfire.datastore.insert(ContentHome.filter.data, TAG_NAMES.COUPON_CATEGORIES, false, function (err, data) {
                  console.log("Saved", data.id);
                  ContentHome.isUpdating = false;
                  ContentHome.filter.id=data.id;
                  ContentHome.filter.data.title=data.data.title;
                  if (err) {
                    ContentHome.isNewItemInserted = false;
                    return console.error('There was a problem saving your data');
                  }
                  $scope.$digest();
                });
              }
            }
            if(!$scope.$apply)
                $scope.$digest();
          }, function (err) {

          });
        }


        ContentHome.deleteFilter=function(index){
          Modals.removePopupModal({'item':'filter'}).then(function (result) {
            if (result) {

              Buildfire.datastore.delete(ContentHome.filters[index].id, TAG_NAMES.COUPON_CATEGORIES, function (err, result) {
                if (err)
                  return;
                //ContentHome.items.splice(_index, 1);
                ContentHome.filters.splice(index, 1);
                $scope.$digest();
              });
            }
          });
        }

        ContentHome.deleteItem=function(index){
          Modals.removePopupModal({'item':'item'}).then(function (result) {
            if (result) {

              Buildfire.datastore.delete(ContentHome.items[index].id, TAG_NAMES.COUPON_ITEMS, function (err, result) {
                if (err)
                  return;
                //ContentHome.items.splice(_index, 1);
                ContentHome.items.splice(index, 1);
                $scope.$digest();
              });
            }
          });
        }

        ContentHome.sortFilterBy = function (value) {
          if (!value) {
            console.info('There was a problem sorting your data');
          } else {
           // ContentHome.data.content.filters=null;
            ContentHome.filters = [];
            ContentHome.searchOptions.skip = 0;
            ContentHome.busy = false;
            ContentHome.data.content.sortFilterBy = value;
            ContentHome.loadMore('filter');
          }
        };

        ContentHome.sortItemBy = function (value) {
          if (!value) {
            console.info('There was a problem sorting your data');
          } else {
            // ContentHome.data.content.filters=null;
            ContentHome.items = [];
            ContentHome.searchOptionsForItems.skip = 0;
            ContentHome.busy = false;
            ContentHome.data.content.sortItemBy = value;
            ContentHome.loadMore('items');
          }
        };


        ContentHome.chooseFilter=function (value, title) {
          if (!value) {
            console.info('There was a problem sorting your data');
          } else {
            ContentHome.data.content.selectedFilter = {"title":title, "id":value};
            ContentHome.items = [];
            ContentHome.searchOptionsForItems.skip = 0;
            ContentHome.searchOptionsForItems.filter= {
              "$or": [{
                "$json.SelectedCategories": {$eq: ContentHome.data.content.selectedFilter.id}
              }]
            }
            ContentHome.loadMore('items');
          }
        };

        /**
         * getSearchOptions(value) is used to get searchOptions with one more key sort which decide the order of sorting.
         * @param value is used to filter sort option.
         * @returns object
         * SORT_FILTER.CATEGORY_NAME_A_Z,
         * SORT_FILTER.CATEGORY_NAME_Z_A
         */
        var getSearchOptions = function (value) {
          ContentHome.filterSortableOptions.disabled = true;
          switch (value) {
            case SORT_FILTER.CATEGORY_NAME_A_Z:
              ContentHome.searchOptions.sort = {"title": 1};
              break;
            case SORT_FILTER.CATEGORY_NAME_Z_A:
              ContentHome.searchOptions.sort = {"title": -1};
              break;
            default :
              ContentHome.filterSortableOptions.disabled = false;
              ContentHome.searchOptions.sort = {"rank": 1};
              break;
          }
          return ContentHome.searchOptions;
        };

        var getItemSearchOptions = function (value) {
          ContentHome.itemSortableOptions.disabled = true;
          switch (value) {
            case SORT.ITEM_TITLE_A_Z:
              ContentHome.searchOptionsForItems.sort = {"title": 1};
              break;
            case SORT.ITEM_TITLE_Z_A:
              ContentHome.searchOptionsForItems.sort = {"title": -1};
              break;
            case SORT.NEWEST_FIRST:
              ContentHome.searchOptionsForItems.sort = {"dateCreated": -1};
              break;
            case SORT.OLDEST_FIRST:
              ContentHome.searchOptionsForItems.sort = {"dateCreated": 1};
              break;
            case SORT.EXPIRATION_DATE_ASC:
              ContentHome.searchOptionsForItems.sort = {"expiresOn": 1};
              break;
            case SORT.EXPIRATION_DATE_DESC:
              ContentHome.searchOptionsForItems.sort = {"expiresOn": -1};
              break;
            default :
              ContentHome.itemSortableOptions.disabled = false;
              ContentHome.searchOptionsForItems.sort = {"rank": 1};
              break;
          }
          return ContentHome.searchOptionsForItems;
        };

        ContentHome.loadMore = function (str) {
          Buildfire.spinner.show();
          if (ContentHome.busy) {
            return;
          }

          ContentHome.busy = true;
          if (ContentHome.data && ContentHome.data.content.sortFilterBy) {
            ContentHome.searchOptions = getSearchOptions(ContentHome.data.content.sortFilterBy);
          }else{
            return;
          }
          if(str!=='items')
          Buildfire.datastore.search(ContentHome.searchOptions, TAG_NAMES.COUPON_CATEGORIES, function (err, result) {
            if (err) {
              Buildfire.spinner.hide();
              return console.error('-----------err in getting list-------------', err);
            }
            if (result.length <= SORT_FILTER._limit) {// to indicate there are more
              ContentHome.noMore = true;
              Buildfire.spinner.hide();
            } else {
              result.pop();
              ContentHome.searchOptions.skip = ContentHome.searchOptions.skip + SORT_FILTER._limit;
              ContentHome.noMore = false;
            }
            var tmpArray=[];
            var lastIndex=result.length;
            result.forEach(function(res,index){
              tmpArray.push({'title' : res.data.title,
              rank:index +1,
                id:res.data.id});
            });

            ContentHome.filters = ContentHome.filters ? ContentHome.filters.concat(result) : result;
            ContentHome.busy = false;
            Buildfire.spinner.hide();
            $scope.$digest();
          });

          if (ContentHome.data && ContentHome.data.content.sortItemBy) {
            ContentHome.searchOptionsForItems = getItemSearchOptions(ContentHome.data.content.sortItemBy);
          }else{
            return;
          }
          if(str!=='filter')
            Buildfire.datastore.search(ContentHome.searchOptionsForItems, TAG_NAMES.COUPON_ITEMS, function (err, result) {
            if (err) {
              Buildfire.spinner.hide();
              return console.error('-----------err in getting list-------------', err);
            }
            if (result.length <= SORT._limit) {// to indicate there are more
              ContentHome.noMore = true;
              Buildfire.spinner.hide();
            } else {
              result.pop();
              ContentHome.searchOptionsForItems.skip = ContentHome.searchOptionsForItems.skip + SORT._limit;
              ContentHome.noMore = false;
            }
            var tmpArray=[];
            var lastIndex=result.length;
            result.forEach(function(res,index){
              tmpArray.push({'title' : res.data.title,
                rank:index +1,
                summary : res.data.summary,
                categories : res.data.Categories.length,
                expiresOn : res.data.expiresOn,
                listImage  : res.data.listImage,
                id:res.id});
            });

            ContentHome.items = ContentHome.items ? ContentHome.items.concat(result) : result;
            ContentHome.busy = false;
            Buildfire.spinner.hide();
            $scope.$digest();
          });
        };


        /*
         * Call the datastore to save the data object
         */
        var saveData = function (newObj, tag) {
          if (typeof newObj === 'undefined') {
            return;
          }
          var success = function (result) {
              console.info('Saved data result: ', result);
              RankOfLastFilter.setRank(result.data.content.rankOfLastFilter);
              RankOfLastItem.setRank(result.data.content.rankOfLastItem);
              updateMasterItem(newObj);
            }
            , error = function (err) {
              console.error('Error while saving data : ', err);
            };
          newObj.content.rankOfLastFilter = newObj.content.rankOfLastFilter || 0;
          DataStore.save(newObj, tag).then(success, error);
        };

        function isValidItem(item) {
          if(item){
            return item.title;
          }
          else{
            return false;
          }

        }

        var updateItemsWithDelay = function (item) {
          ContentHome.isUpdating = false;
          ContentHome.isItemValid = isValidItem(ContentHome.filter);
          if (!ContentHome.isUpdating && !isUnchanged(ContentHome.filter) && ContentHome.isItemValid) {
           setTimeout(function () {
              if (item.id) {
                ContentHome.updateItemData();
                $scope.$digest();
              } /*else if (!ContentHome.isNewItemInserted) {
                ContentHome.addNewItem();
              }*/
            }, 300);
          }
        };

        ContentHome.updateItemData = function () {
          Buildfire.datastore.update(ContentHome.filter.id, ContentHome.filter, TAG_NAMES.COUPON_CATEGORIES, function (err) {
            ContentHome.isUpdating = false;
            if (err)
              return console.error('There was a problem saving your data');
          })
        };

        var saveDataWithDelay = function (newObj) {
          if (newObj) {
            if (isUnchanged(newObj)) {
              return;
            }
            if (tmrDelay) {
              clearTimeout(tmrDelay);
            }
            tmrDelay = setTimeout(function () {
              saveData(JSON.parse(angular.toJson(newObj)), TAG_NAMES.COUPON_INFO);
            }, 500);
          }
        };


        /*
         * Go pull any previously saved data
         * */
        var init = function () {
          var success = function (result) {
              console.info('Init success result:', result);
              ContentHome.data = result.data;
              if (!ContentHome.data) {
                ContentHome.data = angular.copy(_data);
              } else {
                if (!ContentHome.data.content)
                  ContentHome.data.content = {};
                if (!ContentHome.data.settings)
                  ContentHome.data.settings = {};
                if (!ContentHome.data.content.carouselImages)
                  editor.loadItems([]);
                else
                  editor.loadItems(ContentHome.data.content.carouselImages);
                if(!ContentHome.data.content.sortFilterBy)
                  ContentHome.data.content.sortFilterBy=ContentHome.sortFilterOptions[0];
                if(!ContentHome.data.content.sortItemBy)
                  ContentHome.data.content.sortItemBy=ContentHome.sortItemOptions[0];
                ContentHome.filters = [];
                ContentHome.searchOptions.skip = 0;
                ContentHome.busy = false;
                RankOfLastFilter.setRank(ContentHome.data.content.rankOfLastFilter || 0);
                RankOfLastItem.setRank(ContentHome.data.content.rankOfLastItem || 0);
              }
              updateMasterItem(ContentHome.data);
              if (tmrDelay)clearTimeout(tmrDelay);
                ContentHome.loadMore('js');
            }
            , error = function (err) {
              if (err && err.code !== STATUS_CODE.NOT_FOUND) {
                console.error('Error while getting data', err);
                if (tmrDelay)clearTimeout(tmrDelay);
              }
              else if (err && err.code === STATUS_CODE.NOT_FOUND) {
                saveData(JSON.parse(angular.toJson(ContentHome.data)), TAG_NAMES.COUPON_INFO);
              }
            };
          DataStore.get(TAG_NAMES.COUPON_INFO).then(success, error);

        };

        init();

        updateMasterItem(_data);

        /*
         * watch for changes in data and trigger the saveDataWithDelay function on change
         * */
        $scope.$watch(function () {
          return ContentHome.data;
        }, saveDataWithDelay, true);

        /*
         * watch for changes in filters and trigger the saveDataWithDelay function on change
         * */
        $scope.$watch(function () {
          return ContentHome.filter;
        }, updateItemsWithDelay, true);


      }]);
})(window.angular, window.buildfire);
