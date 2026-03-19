type SampleType = {
  basic?: string; //Optional type
  union: number | string; //UnionType
  union2: 'name' | 'age'; //UnionType
  tuple: [number, string]; //TupleType
  tuple2: ['string', 1, {}]; //TupleType
  argsFunc: (args: number, args2: string) => void; //function
};
export default SampleType;
