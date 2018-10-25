class RangeHelper {

    static getRangeArrayNumbers(from, to, max) {

        let list = [],
            iterator = 0;

        for (let i = from; i <= to; i++) {

            iterator++;

            if (max < iterator) {
                break;
            }

            list.push(i);



        }

        return list;

    }
}

module.exports = RangeHelper;