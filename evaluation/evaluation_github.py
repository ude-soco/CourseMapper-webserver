import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score,accuracy_score

'''
To do model evaluation there are two functions:

1. To evaluate using CMEB dataset, use the function append_real()
    - the truth files are all in the truth_files folder
    - the result files are all in the result_files folder
    - The evaluation result are saved in eval_results folder

2. To evaluate using textbook dataset, use function evaluate_biology()
    - The evaluation result are saved in eval_result folder
'''

def append_real(truth_file, result_file,domain):
    # df = pd.read_csv("evaluation\macroeconomics_relation_v2.csv",delimiter="\t",header=None)
    df = pd.read_csv(truth_file,delimiter="\t",header=None)
    df = df.rename(columns={0: "prerequisite_concept", 1: "concept",2:"score_real"})
    mask = df['score_real'] == -1
    df.loc[mask, ['prerequisite_concept', 'concept']] = df.loc[mask, ['concept', 'prerequisite_concept']].values
    df.loc[mask, 'score_real'] = 1
    # result = pd.read_csv("prerequisite_relationships_econ.csv",index_col=0)
    result = pd.read_csv(result_file,index_col=0)
    result = pd.merge(result,df,how="inner", on= ['prerequisite_concept', 'concept'])
    real_result = result["score_real"]
    weighted_unweighted = result[["score_weighted","score_unweighted"]]
    result.to_csv("djafdf.csv")
    result = result.loc[:, ~result.columns.str.contains('_unweighted')]
    result.columns = result.columns.str.replace('_weighted', '')
    # result.to_csv("resss.csv")
    result = result.drop(columns=['prerequisite_concept', 'concept',"score_real","score"])
    result["temporal"] = abs(result["temporal_1"]-result["temporal_2"])
    result["article_contents"] = abs(result["article_contents_1"]-result["article_contents_2"])
    result["abstract_contents"] = abs(result["abstract_contents_1"]-result["abstract_contents_2"])
    result["link_on_rel_abstract"] = abs(result["link_on_rel_abstract_1"]-result["link_on_rel_abstract_2"])
    result["refD"] = abs(result["refD_1"]-result["refD_2"])
    result["inlink_outlink"] = abs(result["inlink_outlink_1"]-result["inlink_outlink_2"])
    result["category"] = abs(result["category_1"]-result["category_2"])
    result["super_category"] = abs(result["super_category_1"]-result["super_category_2"])
    result["berttopic"] = abs(result["berttopic_1"]-result["berttopic_2"])
    result["coursemapper_channel"] = abs(result["coursemapper_channel_1"]-result["coursemapper_channel_2"])
    result["sumall"] = result["article_contents"] + result["abstract_contents"] + result["link_on_rel_abstract"] + result["refD"] + result["inlink_outlink"] + result["category"] + result["super_category"] + result["berttopic"]
    result ["1-to-2"] = result["article_contents_1"] + result["abstract_contents_1"] + result["link_on_rel_abstract_1"] + result["refD_1"] + result["inlink_outlink_1"] + result["category_1"] + result["super_category_1"] + result["berttopic_1"] 
    result["sumall"] = result["sumall"].apply(lambda x: 1 if x > 3 else 0)
    result["1-to-2"] = result["1-to-2"].apply(lambda x: 1 if x > 3 else 0)
    result = result.loc[:, ~result.columns.str.contains('_1')]
    result = result.loc[:, ~result.columns.str.contains('_2')]
    weighted_unweighted[["score_weighted", "score_unweighted"]] = weighted_unweighted.map(lambda x: 1 if x > 0.27 else 0)

    final = []
    for column in result.columns:
        final.append(calculate_metrics(result[column], real_result))
    for column in weighted_unweighted.columns:
        final.append(calculate_metrics(weighted_unweighted[column], real_result))
    final = pd.DataFrame(final)
    # final.to_csv("evaluation\\final_econ.csv")
    final.to_csv("evaluation\\eval_results\\final_"+ domain + ".csv")

def calculate_metrics(model_result, real_values,name = ""):
    # Calculate precision, recall, and f1 score
    precision = precision_score(real_values, model_result, average='binary', zero_division=0.0)
    recall = recall_score(real_values, model_result, average='binary', zero_division=0.0)
    f1 = f1_score(real_values, model_result, average='binary', zero_division=0.0)
    accuracy = accuracy_score(real_values, model_result)
    
    # Create a dictionary with the metrics
    metrics_dict = {
        'column_name': model_result.name + "_"+ name,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        "accuracy": accuracy
    }
    
    return metrics_dict


def evaluate_biology():
    result = pd.read_csv("prerequisite_relationships_science.csv",index_col=0)
    result.columns = result.columns.str.replace('_weighted', '')
    result["temporal"] = abs(result["temporal_1"]-result["temporal_2"])
    result["article_contents"] = abs(result["article_contents_1"]-result["article_contents_2"])
    result["abstract_contents"] = abs(result["abstract_contents_1"]-result["abstract_contents_2"])
    result["link_on_rel_abstract"] = abs(result["link_on_rel_abstract_1"]-result["link_on_rel_abstract_2"])
    result["refD"] = abs(result["refD_1"]-result["refD_2"])
    result["inlink_outlink"] = abs(result["inlink_outlink_1"]-result["inlink_outlink_2"])
    result["category"] = abs(result["category_1"]-result["category_2"])
    result["super_category"] = abs(result["super_category_1"]-result["super_category_2"])
    result["berttopic"] = abs(result["berttopic_1"]-result["berttopic_2"])
    result["coursemapper_channel"] = abs(result["coursemapper_channel_1"]-result["coursemapper_channel_2"])
    result["sumall"] = result["article_contents"] + result["abstract_contents"] + result["link_on_rel_abstract"] + result["refD"] + result["inlink_outlink"] + result["category"] + result["super_category"] + result["berttopic"]
    result ["1-to-2"] = result["article_contents_1"] + result["abstract_contents_1"] + result["link_on_rel_abstract_1"] + result["refD_1"] + result["inlink_outlink_1"] + result["category_1"] + result["super_category_1"] + result["berttopic_1"] 
    result["sumall"] = result["sumall"].apply(lambda x: 1 if x > 3 else 0)
    result["1-to-2"] = result["1-to-2"].apply(lambda x: 1 if x > 3 else 0)
    result = result.loc[:, ~result.columns.str.contains('_1')]
    result = result.loc[:, ~result.columns.str.contains('_2')]
    result = result.rename(columns={"score": "score_weighted"})
    result_jess = pd.read_csv("evaluation\\truth_files\\Interview_science.csv",index_col=0)
    result = pd.merge(result,result_jess,on=["prerequisite_concept","concept","score_weighted","score_unweighted"])
    result_jess = result[["Jess",  "Anja",  "Final"]]
    result = result.drop(["Jess",  "Anja",  "Final"], axis=1)
    result[["score_weighted", "score_unweighted"]] = result[["score_weighted", "score_unweighted"]].map(lambda x: 1 if x > 0.27 else 0)
    
    final = []
    for column in result.columns:
        final.append(calculate_metrics(pd.to_numeric(result[column], errors='coerce').fillna(0), pd.to_numeric(result_jess["Final"], errors='coerce').fillna(0) ,"Final"))
    final = pd.DataFrame(final)
    final.to_csv("evaluation\\final_biology.csv")

truth_file = "evaluation\\truth_files\macroeconomics_relation_v2.csv"
result_file = "evaluation\\result_files\prerequisite_relationships_econ.csv"
domain = "econ"

append_real(truth_file, result_file,domain)
