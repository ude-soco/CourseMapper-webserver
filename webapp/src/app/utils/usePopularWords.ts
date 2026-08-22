interface ConceptData{
  text: string,
  value: number
}

export function usePopularWords(words:string[]){
  const wordFrequency = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 10;
    return acc;
  }, {});
  let myData:ConceptData[]  = Object.keys(wordFrequency).map(word => ({
    text: word,
    value: wordFrequency[word]
  }));

  myData.sort((a, b) => b.value - a.value);

  return {data: myData}
}
