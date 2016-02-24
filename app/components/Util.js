export default class Util{
    // returns function that times it's execution
    static time(f, scope) {
        let start, end;

        return function() {
            start = new Date();
            const res = f.apply(this, arguments);
            end = new Date();
            console.log('time', end - start);

            return res;
        }.bind(scope);

    }
}