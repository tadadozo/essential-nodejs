import Enumerable from "linq";

export const EnumerableExtensions = class EnumerableExtensions {
    static sliceArray(items, chunkSize) {
        let chunks = [];
        for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize);
            chunks.push(chunk);
        }
        return chunks;
    }

    static desliceChunkArray(chunks) {
        let items = [];
        for (let i = 0; i < chunks.length; i++) {
            items.concat(chunks[i]);
        }
        return items;
    }

    static async forEachAsync(items, fAsync) {
        for (let i = 0; i < items.length; i++) {
            await fAsync(items[i]);
        }
    }

    static async forEachChunkAsync(items, chunkSize, actionPerChunkAsync) {
        //invokes actionsperchunk on each chunk 
        let chunks = this.sliceArray(items, chunkSize);
        for (let i = 0; i < chunks.length; i++) {
            await actionPerChunkAsync(chunks[i]);
        }
    }

    static buildStringMap(items) {
      let map = {};
      items.forEach(p => {
        map[p] = true;
      });
      return map;
    }

    static buildStringMapWithValue(items, toValue) {
      let map = {};
      items.forEach(p => {
        map[p] = toValue(p);
      });
      return map;
    }

    static buildMapFromArray(items, getKey) {
        return Enumerable.from(items).toDictionary(p => getKey(p));
    }

    static getKeysFromDictionary(map, sort){
      let m = map;
      if (map.buckets){
        //support for linq map built with toDictionary
        m = map.buckets;
      }
      let list = [];
      for(var key in m){
        list.push(key);
      }

      if (sort){
        list = Enumerable.from(list).orderBy(p => p).toArray();
      }

      return list;
    }

    static joinStringsFromEnumerable(itemsEnumerable, delimiter) {
        let s = "";
        let index = 0;
        itemsEnumerable.forEach(p => {
            if (index > 0) {
                s += delimiter;
            }
            index++;
            s += p;
        });

        return s;
    }

    static joinStringExpressionsFromArray(items, delimiter, buildExpression) {
        let expressions =
            Enumerable.from(items)
                .select(p => buildExpression(p));

        return this.joinStringsFromEnumerable(expressions, delimiter);
    }

  static applyIndex(items, indexKey) {
    if (!indexKey) {
      indexKey = "_index";
    }
    let index = 0;
    items.forEach(p => {
      index++;
      p[indexKey] = index;
    });

    return index;
  }

  static convertArrayToItemArray(items, itemName) {
    if (!itemName) {
      itemName = "item";
    }
    let output = [];

    items.forEach(p => {
      let p1 = {};
      p1[itemName] = p;
      output.push(p1);
    });
    return output;
  }

  static convertDictionaryToArray(map, createItem) {
    let items = [];
    for (var p in map) {
      let v = {
        key: p,
        value: map[p]
      };
      if (createItem) {
        v = createItem(v);
      }
      items.push(v);
    }

    return items;
  }

  static uniqueWordsInSentence(sentence){
    return this.uniqueArray(sentence.split(" ")).join(" ");
  }

  static uniqueArray(array){
    let map = {};
    array.forEach(p => {
      map[p] = true;
    });

    let items = [];
    for(var p in map){
      items.push(p);
    }
    return items;
  }

  static _compareItem(key, type, item1, item2){
    return {
      key: key,
      type:type,
      item1: item1,
      item2: item2
    };
  }

  static mergeCompare(items1, items2, getKey){
    let items = {
      leftOnly:[],
      rightOnly:[],
      both:[]
    };
    let map2 = Enumerable.from(items2).toDictionary(getKey);
    let foundItems2 = [];
    //-- iterate items1
    items1.forEach(p => {
      let key = getKey(p);
      let item2 = map2.get(key);
      let type = "left only";
      if (item2){
        type = "both";
        foundItems2.push(item2);
        items.both.push(this._compareItem(key, type, p, item2));
      }
      else {
        item2 = null;
        items.leftOnly.push(this._compareItem(key, type, p, item2));
      }
    });
    //-- make map of found items2 and filter items2
    let foundItems2Map = Enumerable.from(foundItems2).toDictionary(getKey);
    items2 = items2.filter(p => !foundItems2Map.get(getKey(p)));

    //-- iterate left items2
    items2.forEach(p => {
      let key = getKey(p);
      let type = "right only";
      items.rightOnly.push(this._compareItem(key, type, null, p));
    });
    return items;
  }
}
